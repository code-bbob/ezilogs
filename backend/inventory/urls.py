from django.urls import path
from .import views

urlpatterns = [
    path('purchasetransaction/', views.PurchaseTransactionView.as_view(), name='purchase'),
    path('purchasetransaction/<int:pk>/', views.PurchaseTransactionView.as_view(), name='purchase_detail'),
    path('purchase-report/', views.PurchaseReportView.as_view(), name='purchase_report'),
    # path('purchase/<int:pk>/', views.PurchaseTransactionDetailView.as_view(), name='purchase_detail'),
    path('category/', views.CategoryView.as_view(), name='category'),
    path('category/<int:pk>/', views.CategoryView.as_view(), name='category_detail'),
    path('item/', views.ItemView.as_view(), name='item'),
    path('item/<int:pk>/', views.ItemView.as_view(), name='item_detail'),

]