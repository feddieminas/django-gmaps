from django.db import models

class Place(models.Model):
    name = models.TextField()
    longitude = models.DecimalField(max_digits=30, decimal_places=15)
    latitude = models.DecimalField(max_digits=30, decimal_places=15)

    def __str__(self):
        return '{}'.format(self.name)