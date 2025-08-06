from django.db import models
from datetime import datetime
from django.utils import timezone
from enterprise.models import Person,Enterprise
from repair.models import Repair
# Create your models here.

class Transaction(models.Model):
    date = models.DateField()
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name="transaction")
    transaction_from = models.ForeignKey(Person, on_delete=models.CASCADE,null=True,related_name="transaction_from")
    transaction_to = models.ForeignKey(Person,on_delete=models.CASCADE,null=True,related_name="transaction_to")
    desc = models.CharField(max_length=50,null=True,blank=True)
    amount = models.IntegerField(null=True, blank = True)


class Credit(models.Model):
    transaction = models.ManyToManyField(Transaction,related_name="credit_transactions",blank=True)
    repair = models.ManyToManyField('repair.Repair', related_name="credit_repairs", blank=True)#related name uta reverse relation query ma pani use hunxa 
    name = models.CharField(max_length=20)
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name="credit")
    due = models.IntegerField()

    def __str__(self):
        return self.name
    

class CreditTransaction(models.Model):
    date = models.DateField()
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name="credit_enterprise",null=True)
    transaction_from = models.ForeignKey(Credit, on_delete=models.CASCADE,related_name="credit_transaction_from")
    desc = models.CharField(max_length=50,null=True,blank=True)
    amount = models.IntegerField(null=True,blank=True)
    repair = models.ForeignKey(Repair,blank=True,on_delete=models.CASCADE)    

    def __str__(self):
        return f"{self.transaction_from.name} to {self.enterprise}({self.id})"
    #########views lekhna baki aba 
    