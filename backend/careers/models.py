from django.db import models


class CareerProfile(models.Model):
    name = models.CharField(max_length=120)
    target_role = models.CharField(max_length=120)
    experience_level = models.CharField(max_length=100)
    existing_skills = models.JSONField(default=list)
    weekly_learning_hours = models.PositiveSmallIntegerField()
    job_description = models.TextField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class SkillAnalysis(models.Model):
    career_profile = models.ForeignKey(CareerProfile, on_delete=models.CASCADE, related_name="analyses")
    extracted_requirements = models.JSONField()
    skill_gaps = models.JSONField()
    alignment_score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


class CareerProject(models.Model):
    career_profile = models.ForeignKey(CareerProfile, on_delete=models.CASCADE, related_name="projects")
    analysis = models.ForeignKey(SkillAnalysis, null=True, on_delete=models.SET_NULL, related_name="projects")
    title = models.CharField(max_length=200)
    description = models.TextField()
    project_data = models.JSONField()
    rubric_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class ProjectSubmission(models.Model):
    career_project = models.ForeignKey(CareerProject, on_delete=models.CASCADE, related_name="submissions")
    submission_text = models.TextField()
    repository_url = models.URLField(blank=True, max_length=300)
    assessment_data = models.JSONField()
    score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
