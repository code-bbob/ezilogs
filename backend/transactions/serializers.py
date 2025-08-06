from rest_framework import serializers
from .models import Transaction,Credit,CreditTransaction
from repair.serializers import AdminRepairSerializer

class TransactionSerializer(serializers.ModelSerializer):
    transaction_from_name = serializers.SerializerMethodField(read_only=True)
    transaction_to_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'

    def get_transaction_from_name(self, obj):
        return obj.transaction_from.user.name  # Adjust if the field is different

    def get_transaction_to_name(self, obj):
        return obj.transaction_to.user.name  # Adjust if the field is different

class CreditSerializer(serializers.ModelSerializer):
    repair = AdminRepairSerializer(many=True,read_only=True)
    class Meta:
        model = Credit
        fields = '__all__'

class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = '__all__'