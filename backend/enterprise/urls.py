from django.urls import path
from . import views

urlpatterns = [
    path('profit/', views.EnterpriseProfit.as_view(), name='enterprise_profit'),
    path('techs/',views.TechniciansView.as_view(), name="techs"),
    path('outside/',views.OutsideView.as_view(),name="outside"),
    path('persons/',views.PersonView.as_view(),name='persons')
   
]