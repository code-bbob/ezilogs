from django.db import models
# from repair.models import Repair
# from django.contrib.auth import get_user_model
from django.conf import settings

# Create your models here.

# user=get_user_model()

class Enterprise(models.Model):
    name = models.CharField(max_length=40)
    repairs = models.ManyToManyField('repair.Repair', related_name="enterprise_repairs", blank=True)#related name uta reverse relation query ma pani use hunxa 
    def __str__(self):
        return self.name


class Outside(models.Model):
    name = models.CharField(max_length=30)
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE, related_name="outsides",null=True)
    due = models.IntegerField()

    def __str__(self):
        return self.name    

class Person(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,primary_key=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Staff', 'Staff'),
        ('Technician', 'Technician'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    due = models.IntegerField(null=True, blank=True)
    technician_profit = models.IntegerField()

    def __str__(self):
        return f"{self.user.name} - {self.role} at {self.enterprise.name}"
    

      