import re

from rest_framework import serializers

from .models import CareerProfile, CareerProject, ProjectSubmission


class SkillListField(serializers.Field):
    """Accepts a list of strings or a comma/newline-separated string."""

    def to_internal_value(self, data):
        items = re.split(r"[,;\n]", data) if isinstance(data, str) else data
        if not isinstance(items, list):
            raise serializers.ValidationError("Provide skills as a list or comma-separated text.")
        cleaned, seen = [], set()
        for it in items:
            if not isinstance(it, str):
                raise serializers.ValidationError("Each skill must be text.")
            s = " ".join(it.split())
            if not s:
                continue
            if len(s) > 80:
                raise serializers.ValidationError("Each skill must be 80 characters or fewer.")
            if s.lower() not in seen:
                seen.add(s.lower())
                cleaned.append(s)
        if len(cleaned) > 40:
            raise serializers.ValidationError("Please list 40 skills or fewer.")
        return cleaned

    def to_representation(self, value):
        return value


class CareerProfileSerializer(serializers.ModelSerializer):
    existing_skills = SkillListField(required=False)
    weekly_learning_hours = serializers.IntegerField(min_value=1, max_value=80)
    job_description = serializers.CharField(required=False, allow_blank=True, max_length=8000)

    class Meta:
        model = CareerProfile
        fields = ["id", "name", "target_role", "experience_level", "existing_skills",
                  "weekly_learning_hours", "job_description", "is_demo", "created_at"]
        read_only_fields = ["id", "created_at"]


class AnalyzeRequestSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField(min_value=1)


class GenerateProjectRequestSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField(min_value=1)
    analysis_id = serializers.IntegerField(min_value=1, required=False)
    previous_project_id = serializers.IntegerField(min_value=1, required=False)


class SubmissionRequestSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(min_value=1)
    submission_text = serializers.CharField(min_length=40, max_length=12000)
    repository_url = serializers.URLField(required=False, allow_blank=True, max_length=300)

    def validate_repository_url(self, value):
        if value and not value.lower().startswith(("http://", "https://")):
            raise serializers.ValidationError("Use an http(s) link.")
        return value


def project_payload(p: CareerProject):
    return {
        "id": p.id, "profile_id": p.career_profile_id, "analysis_id": p.analysis_id,
        "title": p.title, "project": p.project_data, "rubric": p.rubric_data,
        "created_at": p.created_at,
    }


def submission_payload(s: ProjectSubmission):
    return {
        "id": s.id, "project_id": s.career_project_id, "score": s.score,
        "assessment": s.assessment_data, "repository_url": s.repository_url,
        "repository_inspected": False,
        "disclaimer": ("AI-assisted estimate based only on the text you submitted. It is not a "
                       "certification of competence. Any repository link was not opened or analysed."),
        "created_at": s.created_at,
    }
