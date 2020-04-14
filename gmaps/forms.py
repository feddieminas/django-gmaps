from django import forms
from projects.models import Project, CountryField
from django_countries.widgets import CountrySelectWidget

class ProjectsFilterForm(forms.Form):
    PHASE_INDEX_CHOICES = [('', 'All Phases')] + list(Project.PHASE_TYPE_CHOICES)
    country = CountryField(blank_label='All Countries', blank=True).formfield(
        widget=CountrySelectWidget(attrs={})
    )
    phase = forms.ChoiceField(choices=PHASE_INDEX_CHOICES, label='Phase', required=False)

    def __init__(self, *args, **kwargs): 
        super(ProjectsFilterForm, self).__init__(*args, **kwargs)                       
        self.fields['phase'].disabled = True