from django.urls import path

from projects.views import ProjectListView, ProjectCreateView, ProjectDetailView, ProjectUpdateView, ProjectDeleteView

app_name = 'projects'
urlpatterns = [
    path('', ProjectListView.as_view(), name='projects-list'),
    path('create', ProjectCreateView.as_view(), name='project-create'),
    path('<int:pk>', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:pk>/update', ProjectUpdateView.as_view(), name='project-update'),
    path('<int:pk>/delete', ProjectDeleteView.as_view(), name='project-delete'),
]