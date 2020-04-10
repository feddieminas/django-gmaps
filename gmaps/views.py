import os
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.generic import View
from django.core.serializers import serialize
from django.db.models import Q
from django.http import JsonResponse
from .forms import ProjectsFilterForm
from projects.models import Project
from .models import Place
import requests


def geocodeAddress(distinct_countries, api_key):
    places = [i[0] for i in list(
        Place.objects.values_list('name').distinct()
    )]
    for address in distinct_countries:
        if not address in places:
            api_response = requests.get('https://maps.googleapis.com/maps/api/geocode/json?address=&key={0}&components=country:{1}'.format(api_key, address))
            api_response_dict = api_response.json()
            p = Place(
                name=address,
                latitude=api_response_dict['results'][0]['geometry']['location']['lat'],
                longitude=api_response_dict['results'][0]['geometry']['location']['lng']
            )
            p.save()
            places.append(address)
    return Place.objects.all()


"""Home Page Containing the Maps

Returns:
    Template -- Sidebar filtering and Maps
"""
@method_decorator(login_required, name='dispatch')
class IndexView(View):
    form = ProjectsFilterForm()
    gm_key = os.environ.get("api_key")

    def get(self, request, *args, **kwargs):
        distinct_countries = [i[0] for i in list(
            Project.objects.values_list('country').distinct()
        )]
        projectsLatLng = geocodeAddress(distinct_countries, self.gm_key)
        context_data = {'filter_form': self.form, 
                        "gm_key": self.gm_key, 
                        "projects": serialize("json",
                         Project.objects.all()),
                        "projectsLatLng": serialize("json",
                         projectsLatLng)                        
                        }
        return render(request, 'index.html', context_data)

    def post(self, request, *args, **kwargs):
        filter_form = ProjectsFilterForm(request.POST)
        if filter_form.is_valid():
            country, phase = filter_form.cleaned_data['country'], filter_form.cleaned_data['phase']
            params_is_null = list(map(lambda x : x in [''], [country,phase]))
            if all(params_is_null):
                projects_filtered = Project.objects.all()
            elif any(params_is_null):
                projects_filtered = Project.objects.filter(
                    Q(country__iexact=country) | Q(phase__iexact=phase))
            else:
                projects_filtered = Project.objects.filter(
                    Q(country__iexact=country) & Q(phase__iexact=phase))
        else:
            projects_filtered = Project.objects.none()
        return JsonResponse({'projects': serialize("json", projects_filtered)})