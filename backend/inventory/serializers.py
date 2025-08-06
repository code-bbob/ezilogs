from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import Item,Purchase,PurchaseTransaction,Category

class ItemSerializer(ModelSerializer):
    category_name = serializers.SerializerMethodField()
    class Meta:
        model = Item
        fields = '__all__'

    def get_category_name(self, obj):
        return obj.category.name
    
    

class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class PurchaseSerializer(ModelSerializer):
    id = serializers.IntegerField(required=False)
    # include item name for frontend display
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category.name', read_only=True)
    class Meta:
        model = Purchase 
        # include item_name alongside item id, quantity, price
        fields = ['id', 'item', 'item_name', 'item_category', 'quantity', 'price']

class PurchaseTransactionSerializer(ModelSerializer):
    purchases = PurchaseSerializer(many=True)
    purchased_by_name = serializers.SerializerMethodField()
    class Meta:
        model = PurchaseTransaction
        fields = '__all__'

    def create(self, validated_data):
        purchase_data = validated_data.pop('purchases')
        purchase_transaction = PurchaseTransaction.objects.create(**validated_data)
        for purchase in purchase_data:
            purchase_instance = Purchase.objects.create(transaction=purchase_transaction, **purchase)
            item = purchase_instance.item
            item.quantity = (item.quantity or 0) + purchase_instance.quantity
            item.save()
        purchase_transaction.calculate_total_amount()
        return purchase_transaction

    def get_purchased_by_name(self, obj):
        return obj.purchased_by.user.name if obj.purchased_by else None


class PurchaseReportSerializer(PurchaseSerializer):
    """
    Extended serializer for purchase reports with additional transaction details
    """
    transaction_date = serializers.DateField(source='transaction.date', read_only=True)
    purchased_by_name = serializers.CharField(source='transaction.purchased_by.user.name', read_only=True)
    transaction_id = serializers.IntegerField(source='transaction.id', read_only=True)
    total_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = Purchase
        fields = ['id', 'item', 'item_name', 'item_category', 'quantity', 'price', 
                 'transaction_date', 'purchased_by_name', 'transaction_id', 'total_cost']
    
    def get_total_cost(self, obj):
        return obj.price * obj.quantity