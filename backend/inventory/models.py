from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=20)
    enterprise = models.ForeignKey('enterprise.Enterprise', on_delete=models.CASCADE)


class Item(models.Model):
    name = models.CharField(max_length=255)
    quantity = models.IntegerField(null=True,blank=True)
    cost = models.FloatField()
    enterprise = models.ForeignKey('enterprise.Enterprise', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.ForeignKey(Category,on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class PurchaseTransaction(models.Model):

    date = models.DateField(auto_now_add=True)
    total_amount = models.FloatField(null=True,blank=True)
    enterprise = models.ForeignKey('enterprise.Enterprise',on_delete=models.CASCADE)
    purchased_by = models.ForeignKey('enterprise.Person',on_delete=models.CASCADE)

    def calculate_total_amount(self):
        total = sum(purchase.price * purchase.quantity for purchase in self.purchases.all())
        self.total_amount = total
        self.save()

class Purchase(models.Model):

    item = models.ForeignKey(Item,on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.FloatField()
    transaction = models.ForeignKey(PurchaseTransaction,on_delete=models.CASCADE,related_name='purchases')

