from .models import Enterprise,Outside,Person
from rest_framework import serializers
from repair.models import Repair

  
class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = '__all__'

class AdminProfitSerializer(serializers.ModelSerializer):
    repaired_by_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Repair
        fields = ['repair_id','phone_model','customer_name','repair_profit','technician_profit','my_profit','admin_only_profit','repaired_by','repaired_by_name','delivery_date']

    def get_repaired_by_name(self, obj):
        return obj.repaired_by.user.name if obj.repaired_by and obj.repaired_by.user else None

class TechnicianProfitSerializer(serializers.ModelSerializer):
    repaired_by_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Repair
        fields = ['repair_id','phone_model','repair_profit','technician_profit','repaired_by','repaired_by_name','delivery_date']
    
    def get_repaired_by_name(self, obj):
        return obj.repaired_by.user.name if obj.repaired_by and obj.repaired_by.user else None
    
class OutsideRepairSerializer(serializers.ModelSerializer):
    class Meta:
        model = Outside
        fields = '__all__'

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'