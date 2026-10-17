from django.contrib.auth import authenticate, get_user_model
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from ai_services import gemma_client as ai

from . import demo, scoring
from .api import fail, ok
from .models import CareerProfile, CareerProject, ProjectSubmission, SkillAnalysis
from .serializers import (AnalyzeRequestSerializer, CareerProfileSerializer,
                          GenerateProjectRequestSerializer, LoginSerializer, RegisterSerializer,
                          SubmissionRequestSerializer, project_payload, submission_payload)

User = get_user_model()


def _guard(request, profile):
    """Plans owned by an account are visible only to that account (404, not 403, to avoid leaking ids).
    Guest plans (no owner) stay reachable by id, as in the no-login demo."""
    if profile.owner_id and profile.owner_id != getattr(request.user, "id", None):
        raise Http404
    return profile


def user_payload(user):
    last = user.career_profiles.order_by("-created_at").first()
    return {
        "id": user.id,
        "name": user.first_name or user.email.split("@")[0],
        "email": user.email,
        "last_profile": None if last is None else {
            "experience_level": last.experience_level,
            "existing_skills": last.existing_skills,
            "weekly_learning_hours": last.weekly_learning_hours,
        },
    }


class RegisterView(APIView):
    authentication_classes = []  # a stale token must never block sign-up
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        user = User.objects.create_user(username=d["email"], email=d["email"], password=d["password"],
                                        first_name=d["name"].strip())
        token, _ = Token.objects.get_or_create(user=user)
        return ok({"token": token.key, "user": user_payload(user)}, 201)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        user = authenticate(request=request, username=d["email"].strip().lower(), password=d["password"])
        if user is None:  # same message for unknown email and wrong password
            return fail("invalid_credentials", "Incorrect email or password.", 401)
        token, _ = Token.objects.get_or_create(user=user)
        return ok({"token": token.key, "user": user_payload(user)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return ok({"logged_out": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return ok(user_payload(request.user))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_plans(request):
    plans = []
    for p in request.user.career_profiles.order_by("-created_at")[:50]:
        a = p.analyses.order_by("-created_at").first()
        pr = p.projects.order_by("-created_at").first()
        sub = (ProjectSubmission.objects.filter(career_project__career_profile=p)
               .order_by("-created_at").first())
        plans.append({
            "profile_id": p.id, "target_role": p.target_role, "created_at": p.created_at,
            "is_demo": p.is_demo,
            "analysis_id": a.id if a else None, "alignment_score": a.alignment_score if a else None,
            "project_id": pr.id if pr else None, "project_title": pr.title if pr else None,
            "submission_id": sub.id if sub else None, "assessment_score": sub.score if sub else None,
        })
    return ok({"plans": plans})


def analysis_payload(a: SkillAnalysis):
    return {"id": a.id, "profile_id": a.career_profile_id, "requirements": a.extracted_requirements,
            "gap": a.skill_gaps, "alignment_score": a.alignment_score, "created_at": a.created_at}


@api_view(["GET"])
def health(request):
    return ok({"status": "up", "provider": ai.provider(), "model": ai.model_name(),
               "ai_configured": ai.is_configured()})


@api_view(["GET"])
def demo_scenarios(request):
    return ok({"label": demo.DEMO_LABEL, "scenarios": demo.DEMO_SCENARIOS})


@api_view(["POST"])
def create_profile(request):
    s = CareerProfileSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    owner = request.user if request.user.is_authenticated else None
    return ok(CareerProfileSerializer(s.save(owner=owner)).data, 201)


@api_view(["POST"])
def analyze(request):
    req = AnalyzeRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    profile = _guard(request, get_object_or_404(CareerProfile, pk=req.validated_data["profile_id"]))

    requirements = ai.extract_job_requirements(profile.target_role, profile.job_description)
    unmatched = scoring.find_unmatched(requirements["skills"], profile.existing_skills)
    ai_matches, ai_matching_used = {}, False
    if unmatched and profile.existing_skills:
        try:  # synonym matching is a nice-to-have; never fail the analysis because of it
            ai_matches = ai.match_equivalent_skills(unmatched, profile.existing_skills)
            ai_matching_used = True
        except ai.AIServiceError:
            pass
    gap = scoring.compute_gap(requirements["skills"], profile.existing_skills, ai_matches)
    gap["ai_synonym_matching_used"] = ai_matching_used

    analysis = SkillAnalysis.objects.create(
        career_profile=profile, extracted_requirements=requirements,
        skill_gaps=gap, alignment_score=gap["alignment_score"])
    return ok({**analysis_payload(analysis),
               "profile": CareerProfileSerializer(profile).data}, 201)


@api_view(["GET"])
def analysis_detail(request, pk):
    a = get_object_or_404(SkillAnalysis, pk=pk)
    _guard(request, a.career_profile)
    return ok({**analysis_payload(a), "profile": CareerProfileSerializer(a.career_profile).data})


@api_view(["POST"])
def generate_project(request):
    req = GenerateProjectRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    d = req.validated_data
    profile = _guard(request, get_object_or_404(CareerProfile, pk=d["profile_id"]))
    if "analysis_id" in d:
        analysis = get_object_or_404(SkillAnalysis, pk=d["analysis_id"], career_profile=profile)
    else:
        analysis = profile.analyses.order_by("-created_at").first()
    if analysis is None:
        from rest_framework.exceptions import ValidationError
        raise ValidationError({"analysis_id": "Run the skill-gap analysis first."})

    avoid = list(profile.projects.order_by("-created_at").values_list("title", flat=True)[:3])
    if "previous_project_id" in d:
        prev = CareerProject.objects.filter(pk=d["previous_project_id"], career_profile=profile).first()
        if prev and prev.title not in avoid:
            avoid.append(prev.title)

    project = ai.generate_project(
        {"target_role": profile.target_role, "experience_level": profile.experience_level,
         "existing_skills": profile.existing_skills, "weekly_learning_hours": profile.weekly_learning_hours},
        analysis.skill_gaps.get("priorities", []), avoid)
    rubric = ai.generate_rubric(project, profile.target_role)
    obj = CareerProject.objects.create(
        career_profile=profile, analysis=analysis, title=project["title"],
        description=project["problem_statement"], project_data=project, rubric_data=rubric)
    return ok(project_payload(obj), 201)


@api_view(["GET"])
def project_detail(request, pk):
    project = get_object_or_404(CareerProject, pk=pk)
    _guard(request, project.career_profile)
    return ok(project_payload(project))


@api_view(["POST"])
def create_submission(request):
    req = SubmissionRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    d = req.validated_data
    project = get_object_or_404(CareerProject, pk=d["project_id"])
    _guard(request, project.career_profile)
    criteria = project.rubric_data["criteria"]

    raw = ai.evaluate_submission(project.project_data, criteria, d["submission_text"],
                                 d.get("repository_url", ""))
    assessment = scoring.finalize_assessment(criteria, raw)  # totals computed here, not by the model
    sub = ProjectSubmission.objects.create(
        career_project=project, submission_text=d["submission_text"],
        repository_url=d.get("repository_url", ""), assessment_data=assessment,
        score=assessment["total_score"])
    return ok(submission_payload(sub), 201)


@api_view(["GET"])
def submission_results(request, pk):
    sub = get_object_or_404(ProjectSubmission, pk=pk)
    _guard(request, sub.career_project.career_profile)
    data = submission_payload(sub)
    data["project"] = project_payload(sub.career_project)
    return ok(data)
