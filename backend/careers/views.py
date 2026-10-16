from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view

from ai_services import gemma_client as ai

from . import demo, scoring
from .api import ok
from .models import CareerProfile, CareerProject, ProjectSubmission, SkillAnalysis
from .serializers import (AnalyzeRequestSerializer, CareerProfileSerializer,
                          GenerateProjectRequestSerializer, SubmissionRequestSerializer,
                          project_payload, submission_payload)


def analysis_payload(a: SkillAnalysis):
    return {"id": a.id, "profile_id": a.career_profile_id, "requirements": a.extracted_requirements,
            "gap": a.skill_gaps, "alignment_score": a.alignment_score, "created_at": a.created_at}


@api_view(["GET"])
def health(request):
    return ok({"status": "up", "provider": ai.provider(), "model": ai.model_name(),
               "ai_configured": ai.is_configured()})


@api_view(["GET"])
def demo_scenario(request):
    return ok({"label": demo.DEMO_LABEL, "profile": demo.DEMO_PROFILE,
               "job_description": demo.DEMO_JOB_DESCRIPTION,
               "sample_submission": demo.DEMO_SUBMISSION})


@api_view(["POST"])
def create_profile(request):
    s = CareerProfileSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    return ok(CareerProfileSerializer(s.save()).data, 201)


@api_view(["POST"])
def analyze(request):
    req = AnalyzeRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    profile = get_object_or_404(CareerProfile, pk=req.validated_data["profile_id"])

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
    return ok({**analysis_payload(a), "profile": CareerProfileSerializer(a.career_profile).data})


@api_view(["POST"])
def generate_project(request):
    req = GenerateProjectRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    d = req.validated_data
    profile = get_object_or_404(CareerProfile, pk=d["profile_id"])
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
    return ok(project_payload(get_object_or_404(CareerProject, pk=pk)))


@api_view(["POST"])
def create_submission(request):
    req = SubmissionRequestSerializer(data=request.data)
    req.is_valid(raise_exception=True)
    d = req.validated_data
    project = get_object_or_404(CareerProject, pk=d["project_id"])
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
    data = submission_payload(sub)
    data["project"] = project_payload(sub.career_project)
    return ok(data)
