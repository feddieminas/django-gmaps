from django import forms
from .models import Project

class ProjectModelForm(forms.ModelForm):  

    class Meta:
        model = Project
        exclude = ('owner', 'timestamp')

    def __init__(self, *args, **kwargs):
        super(ProjectModelForm, self).__init__(*args, **kwargs)
        labels = {
            'mw': 'MW',
            'budget_revenue': 'Budget Revenue (€)',
            'budget_cogs': 'Budget CoGs (€)',
            'cash_out_no_vat': 'Cash Outflow Without VAT (€)',
            'pct_of_completion': "%" + " of completion",
        }

        for field in self.fields:
            if field == 'country':
                self.fields[field].widget.attrs['autofocus'] = True
            
            if field in labels.keys():
                self.fields[field].label = labels[field]
            
            self.fields[field].widget.attrs['class'] = 'form-control'