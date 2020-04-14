from django.shortcuts import render, get_object_or_404, HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.views.generic.detail import DetailView
### ListView ###
from django.views.generic import ListView
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
################
from django.urls import reverse, reverse_lazy
from .models import Project
from .forms import ProjectModelForm
from django.contrib import messages


@method_decorator(login_required, name='dispatch')
class ProjectListView(ListView):
    model = Project
    template_name = 'projects_list.html'
    context_object_name = 'projects'
    paginate_by = 15

    def get_context_data(self, **kwargs):
        context = super(ProjectListView, self).get_context_data(**kwargs)
        projects = self.get_queryset()
        page = self.request.GET.get('page')
        paginator = Paginator(projects, self.paginate_by)
        try:
            projects = paginator.page(page)
        except PageNotAnInteger:
            projects = paginator.page(1)
        except EmptyPage:
            projects = paginator.page(paginator.num_pages)
        context['projects'] = projects
        return context


@method_decorator(login_required, name='dispatch')
class ProjectCreateView(CreateView):
    initial = {'country':'GR', 'phase': 'UD'}
    model = Project
    form_class = ProjectModelForm
    template_name = 'project_create.html'

    def form_valid(self, form):
        super(ProjectCreateView, self).form_valid(form)
        form = form.save(commit=False)
        form.owner = self.request.user
        form.save()
        messages.success(self.request, "Project Created")
        return HttpResponseRedirect(self.get_success_url()) 

    def get_success_url(self):
        return reverse_lazy('projects:projects-list')


@method_decorator(login_required, name='dispatch')
class ProjectDetailView(DetailView):
    model = Project
    template_name = 'project_detail.html'
    context_object_name = 'project'

    def get_object(self):
        return get_object_or_404(Project, pk=self.kwargs.get("pk"))


@method_decorator(login_required, name='dispatch')
class ProjectUpdateView(UpdateView):
    model = Project
    form_class = ProjectModelForm
    template_name = 'project_update.html'
    context_object_name = 'project'

    def get_object(self):
        return get_object_or_404(Project, pk=self.kwargs.get("pk"))

    def form_valid(self, form):
        super(ProjectUpdateView, self).form_valid(form)
        self.object = self.get_object()
        if self.request.user == self.object.owner:
            form = form.save(commit=False)
            form.save()
            messages.info(self.request, "Project Updated")
            return HttpResponseRedirect(self.get_success_url())
        else:
            messages.error(self.request, "Not the owner to change")
            return self.render_to_response(self.get_context_data(form=form))

    def get_success_url(self):
        return reverse_lazy('projects:projects-list')


@method_decorator(login_required, name='dispatch')
class ProjectDeleteView(DeleteView):
    model = Project
    template_name = 'project_delete.html'
    context_object_name = 'project'

    def get_object(self):
        return get_object_or_404(Project, pk=self.kwargs.get("pk"))

    def delete(self, *args, **kwargs):
        self.object = self.get_object()
        if self.request.user == self.object.owner:
            self.object.delete()
            messages.info(self.request, "Project Deleted")
        else:
            messages.error(self.request, "Not the owner to change")
        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse_lazy('projects:projects-list')
