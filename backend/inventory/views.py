from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from .models import PurchaseTransaction,Category,Item
from .serializers import PurchaseTransactionSerializer,CategorySerializer,ItemSerializer
from django.db import transaction
# Create your views here.


class PurchaseTransactionView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_locked_item(self, item_id, cache):
        if item_id not in cache:
            cache[item_id] = Item.objects.select_for_update().get(id=item_id)
        return cache[item_id]



    def get(self, request,pk=None):
        
        if pk:
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            serializer = PurchaseTransactionSerializer(purchase_transaction)
            return Response(serializer.data)
        
        
        purchase_transactions = PurchaseTransaction.objects.filter(enterprise=request.user.person.enterprise)
        purchase_transactions = purchase_transactions.order_by('-id')
        search = request.GET.get('search')
        if search:
            purchase_transaction_product = PurchaseTransaction.objects.filter(purchases__product__icontains = search)
            purchase_transactions = purchase_transaction_product
        serializer = PurchaseTransactionSerializer(purchase_transactions, many=True)
        return Response(serializer.data)
    
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


