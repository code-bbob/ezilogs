from django.contrib import admin
from .models import Enterprise,Person
# Register your models here.

class PersonInline(admin.TabularInline):
    model = Person
    extra = 0

class EnterpriseAdmin(admin.ModelAdmin):
    inlines = [PersonInline]

    def delete_model(self, request, obj):
        # Custom delete logic if needed
        obj.delete()


admin.site.register(Enterprise,EnterpriseAdmin)
admin.site.register(Person)

# admin.site.register(Enterprise)
# admin.site.register(Person)