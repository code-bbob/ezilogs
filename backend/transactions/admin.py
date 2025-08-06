from django.contrib import admin
from .models import Transaction,Credit,CreditTransaction

# Register your models here.

admin.site.register(Transaction)
admin.site.register(Credit)
admin.site.register(CreditTransaction)
