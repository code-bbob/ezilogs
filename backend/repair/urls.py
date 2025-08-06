
from django.urls import path
from . import views

urlpatterns = [
    path('', views.RepairView.as_view(), name='repair'),
    path('stats/',views.CountStat.as_view(),name="count_stat"),
    path('search/', views.SearchView.as_view(), name='search')


]