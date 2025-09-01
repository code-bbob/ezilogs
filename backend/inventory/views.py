from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.pagination import PageNumberPagination
from .models import PurchaseTransaction,Category,Item,Purchase
from repair.models import RepairItem
from .serializers import PurchaseTransactionSerializer,CategorySerializer,ItemSerializer,PurchaseSerializer
from django.db import transaction
from django.utils.dateparse import parse_date
from django.db.models import Q
# Create your views here.


class PurchaseTransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class PurchaseTransactionView(APIView):

    permission_classes = [IsAuthenticated]
    pagination_class = PurchaseTransactionPagination

    def _get_locked_item(self, item_id, cache):
        if item_id not in cache:
            cache[item_id] = Item.objects.select_for_update().get(id=item_id)
        return cache[item_id]

    def get(self, request, pk=None):
        if pk:
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            serializer = PurchaseTransactionSerializer(purchase_transaction)
            return Response(serializer.data)
        
        # Get all purchase transactions for the enterprise
        purchase_transactions = PurchaseTransaction.objects.filter(enterprise=request.user.person.enterprise)
        purchase_transactions = purchase_transactions.order_by('-id')
        
        # Apply search filter
        search = request.GET.get('search')
        if search:
            purchase_transactions = purchase_transactions.filter(purchases__product__icontains=search)
        
        # Apply date filters
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if start_date and end_date:
            start_date_parsed = parse_date(start_date)
            end_date_parsed = parse_date(end_date)
            if start_date_parsed and end_date_parsed:
                purchase_transactions = purchase_transactions.filter(
                    date__range=(start_date_parsed, end_date_parsed)
                )
        
        # Apply pagination
        paginator = self.pagination_class()
        paginated_transactions = paginator.paginate_queryset(purchase_transactions, request)
        serializer = PurchaseTransactionSerializer(paginated_transactions, many=True)
        
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        data["purchased_by"] = request.user.person
        serializer = PurchaseTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def delete(self, request, pk):
        purchase_transaction = PurchaseTransaction.objects.filter(id=pk).first()
        if not purchase_transaction:
            return Response({"detail": "Purchase transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        items_cache = {}

        for purchase in purchase_transaction.purchases.all():
            item = self._get_locked_item(purchase.item.id, items_cache)
            item.quantity= (item.quantity or 0) - purchase.quantity  # Reduce stock

        for item in items_cache.values():
            item.save()

        purchase_transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class CategoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):

        categories = Category.objects.filter(enterprise=request.user.person.enterprise)
        categories = categories.order_by('-id')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    def post(self,request,*args, **kwargs):

        data = request.data
        print("Here is the data",data)
        data["enterprise"] = request.user.person.enterprise.id
        serializer = CategorySerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):

        category = Category.objects.get(id=pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class ItemView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):

        items = Item.objects.filter(enterprise=request.user.person.enterprise)
        # filter by category if provided
        category_id = request.GET.get('category')
        if category_id:
            items = items.filter(category_id=category_id)
        items = items.order_by('-id')
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
    def post(self,request,*args, **kwargs):
            
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        serializer = ItemSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self,request,pk):

        item = Item.objects.get(id=pk)
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):

        item = Item.objects.get(id=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PurchaseReportView(APIView):
    """
    API View for generating purchase reports with filtering capabilities
    Returns individual purchase records (not grouped by transaction)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get query parameters
        search_term = request.GET.get('search', '')
        item_name = request.GET.get('item_name', '')
        category_name = request.GET.get('category', '')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Base queryset - get all purchases for the user's enterprise
        purchases = Purchase.objects.filter(
            transaction__enterprise=request.user.person.enterprise
        ).select_related('item', 'item__category', 'transaction')
        
        # Apply date range filter if provided
        if start_date and end_date:
            start_date_parsed = parse_date(start_date)
            end_date_parsed = parse_date(end_date)
            if start_date_parsed and end_date_parsed:
                purchases = purchases.filter(
                    transaction__date__range=(start_date_parsed, end_date_parsed)
                )
        
        # Apply search filters
        if search_term:
            # Search across multiple fields using Q objects
            search_query = Q()
            search_query |= Q(item__name__icontains=search_term)
            search_query |= Q(item__category__name__icontains=search_term)
            search_query |= Q(transaction__purchased_by__user__name__icontains=search_term)
            purchases = purchases.filter(search_query)
        
        # Apply specific filters
        if item_name:
            purchases = purchases.filter(item__name__icontains=item_name)
        
        if category_name:
            purchases = purchases.filter(item__category__name__icontains=category_name)
        
        # Order by most recent transactions first
        purchases = purchases.order_by('-transaction__date', '-id')
        
        # Serialize the data
        from .serializers import PurchaseReportSerializer
        serializer = PurchaseReportSerializer(purchases, many=True)
        
        # Calculate summary statistics
        total_purchases = purchases.count()
        total_amount = sum(p.price * p.quantity for p in purchases)
        total_quantity = sum(p.quantity for p in purchases)
        
        # Return response with data and summary
        return Response({
            'purchases': serializer.data,
            'summary': {
                'total_purchases': total_purchases,
                'total_amount': total_amount,
                'total_quantity': total_quantity,
                'average_price': total_amount / total_purchases if total_purchases > 0 else 0
            }
        })


class ItemUsageReportView(APIView):
    """
    Returns the list of repairs in which a given inventory item was used,
    with dates and quantities, scoped to the user's enterprise.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, item_id: int):
        enterprise = request.user.person.enterprise

        usages = (
            RepairItem.objects
            .filter(item_id=item_id, repair__enterprise_repairs__name=enterprise)
            .select_related('repair', 'item', 'item__category')
            .order_by('-repair__updated_at', '-id')
        )

        # Optional date filtering using either repair.updated_at (date) or fallback to received_date
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if start_date and end_date:
            start_date_parsed = parse_date(start_date)
            end_date_parsed = parse_date(end_date)
            if start_date_parsed and end_date_parsed:
                usages = usages.filter(
                    Q(repair__updated_at__date__range=(start_date_parsed, end_date_parsed)) |
                    Q(repair__updated_at__isnull=True, repair__received_date__range=(start_date_parsed, end_date_parsed))
                )

        data = []
        total_quantity = 0
        item_meta = None
        for u in usages:
            r = u.repair
            total_quantity += (u.quantity or 0)
            if item_meta is None and u.item:
                item_meta = {
                    'id': u.item.id,
                    'name': u.item.name,
                    'category_id': u.item.category.id if u.item.category else None,
                    'category_name': u.item.category.name if u.item.category else None,
                }
            data.append({
                'repair_pk': r.id,
                'repair_id': r.repair_id,
                'customer_name': r.customer_name,
                'customer_phone_number': r.customer_phone_number,
                'phone_model': r.phone_model,
                'repair_status': r.repair_status,
                'quantity': u.quantity,
                'used_date': r.updated_at or r.received_date,
                'received_date': r.received_date,
                'delivery_date': r.delivery_date,
            })

        return Response({
            'item': item_meta,
            'usage': data,
            'summary': {
                'total_usages': len(data),
                'total_quantity': total_quantity,
            }
        })