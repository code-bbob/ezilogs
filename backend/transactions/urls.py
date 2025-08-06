from django.urls import path
from . import views

urlpatterns = [
    path('', views.TransactionView.as_view(), name='transactions'),
    path('search',views.SearchTransactionView.as_view(), name="search"),
    path('credit/',views.CreditView.as_view(), name="credit"),
    path('credit/<int:pk>',views.CreditView.as_view(), name="credit"),
    path('credittransactions/',views.CreditTransactionView.as_view(),name = "credit_transactions")
]
