from django.contrib import admin
from .models import Item,Category, Purchase, PurchaseTransaction

# Register your models here.

admin.site.register(Item)
admin.site.register(Category)
admin.site.register(Purchase)
admin.site.register(PurchaseTransaction)