from django.db import models
from django.contrib.auth.models import User
from django_countries.fields import CountryField
from django.utils.dateparse import parse_datetime

class Project(models.Model):
    UNDER_DEVELOPMENT = 'UD'
    UNDER_CONSTRUCTION = 'UC'
    REAL_TIME_BIDDING = 'RTB'
    CASH_ON_DELIVERY = 'COD'
    PHASE_TYPE_CHOICES = (
        (UNDER_DEVELOPMENT, 'Under Development'),
        (UNDER_CONSTRUCTION, 'Under Construction'),
        (REAL_TIME_BIDDING, 'Real Time Bidding'),
        (CASH_ON_DELIVERY, 'Cash On Delivery'),
    )

    owner = models.ForeignKey(User, related_name='projects', related_query_name='project', 
    null=False, default=1, on_delete=models.SET_DEFAULT)
    country = CountryField()
    phase = models.CharField(max_length=3, choices=PHASE_TYPE_CHOICES)
    mw = models.DecimalField(max_digits=6, decimal_places=2)
    budget_revenue = models.DecimalField(max_digits=11, decimal_places=3)
    budget_cogs = models.DecimalField(max_digits=11, decimal_places=3)
    cash_out_no_vat = models.DecimalField(max_digits=11, decimal_places=3)
    pct_of_completion = models.DecimalField(max_digits=4, decimal_places=3)
    timestamp = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()

    class Meta:
        ordering = ['-id']
        verbose_name = 'project'
        verbose_name_plural = 'projects'

    def get_fields(self):
        myPrintFieldlst = []
        for field in Project._meta.fields:
            if field.name == "owner":
                myPrintFieldlst.append((field.name, User.objects.get(pk=int(field.value_to_string(self))).username))
            elif field.name == "timestamp":
                myPrintFieldlst.append((field.name, parse_datetime(field.value_to_string(self))))
            else:
                myPrintFieldlst.append((field.name, field.value_to_string(self)))
        return myPrintFieldlst

    def __str__(self):
        return '{} - {} - {}'.format(self.country.name, self.country, self.mw)