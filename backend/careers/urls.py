from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("demo/", views.demo_scenario),
    path("profiles/", views.create_profile),
    path("analyze/", views.analyze),
    path("analyses/<int:pk>/", views.analysis_detail),
    path("projects/generate/", views.generate_project),
    path("projects/<int:pk>/", views.project_detail),
    path("submissions/", views.create_submission),
    path("submissions/<int:pk>/results/", views.submission_results),
]
