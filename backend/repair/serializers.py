from rest_framework import serializers
from .models import Repair,Outside,RepairItem
from inventory.models import Item
from django.db import transaction



class RepairItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RepairItem
        fields = ['item','quantity','item_name']

    def get_item_name(self, obj):
        return f"{obj.item.name} {obj.item.category.name}" if obj.item and obj.item.category else None

class AdminRepairSerializer(serializers.ModelSerializer):
    repaired_by_name = serializers.SerializerMethodField(read_only=True)
    repair_items = RepairItemSerializer(many=True,required=False)
    class Meta:
        model = Repair
        fields = [
            'id',
            'repair_id',
            'customer_name',
            'customer_phone_number',
            'phone_model',
            'repair_problem',
            'repair_description',
            'imei_number',
            # 'model_number',
            'sim_tray',
            'sim',
            'SD_card',
            'phone_cover',
            # 'phone_condition',
            'total_amount',
            'advance_paid',
            'due',
            'received_date',
            'received_by',
            'repaired_by',
            'outside_repair',
            'repair_status',
            'amount_paid',
            'repair_cost_price',
            # 'cost_price_description',
            'repair_items',
            'repair_profit',
            'technician_profit',
            'my_profit',
            'admin_only_profit',
            'outside',
            'outside_name',
            'outside_desc',
            'taken_by',
            'outside_taken_date',
            'returned_by',
            'outside_returned_date',
            'outside_cost',
            'delivery_date',
            'updated_at',
            'repaired_by_name',
            'credit_due',
            'credit_paid'

        ]

    def get_repaired_by_name(self, obj):
        return obj.repaired_by.user.name if obj.repaired_by and obj.repaired_by.user else None


    @transaction.atomic
    def update(self,instance,validated_data):

        repair_items = validated_data.pop('repair_items', None)

        if repair_items:
            # Update the item quantities and delete existing repair items
            for repair_item in instance.repair_items.all():
                if repair_item:
                    item = repair_item.item
                    item.quantity = (repair_item.quantity + item.quantity) if item.quantity is not None else item.quantity
                    item.save()
            # Delete the existing repair items related to this repair
            instance.repair_items.all().delete()

            # Process new repair items
            for item_data in repair_items:
                repair = RepairItem.objects.create(repair=instance, item=item_data['item'], quantity=item_data['quantity'])
                item = repair.item
                item.refresh_from_db()
                # Update item quantity
                item.quantity = (item.quantity - repair.quantity) if (item.quantity and item.quantity > repair.quantity) else 0
                item.save()
        else:
            validated_data.pop('repair_items', None)

        if instance.repair_status == "Completed" and validated_data['repair_status'] != "Completed":
            technician = instance.repaired_by
            technician.due = technician.due - instance.technician_profit
            instance.technician_profit = 0
            instance.my_profit = 0
            instance.repair_profit = 0
            technician.save()


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class TechnicianRepairSerializer(serializers.ModelSerializer):
    repaired_by_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Repair
        fields = [
            'id',
            'repair_id',
            'customer_name',
            'customer_phone_number',
            'phone_model',
            'repair_problem',
            'repair_description',
            'imei_number',
            # 'model_number',
            'sim_tray',
            'sim',
            'SD_card',
            'phone_cover',
            # 'phone_condition',
            'total_amount',
            'advance_paid',
            'due',
            'received_date',
            'received_by',
            'repaired_by',
            'outside_repair',
            'repair_status',
            'amount_paid',
            'repair_cost_price',
            # 'cost_price_description',
            'repair_items',
            'repair_profit',
            'technician_profit',
            'my_profit',
            'admin_only_profit',
            'outside',
            'outside_name',
            'outside_desc',
            'taken_by',
            'outside_taken_date',
            'returned_by',
            'outside_returned_date',
            'outside_cost',
            'delivery_date',
            'updated_at',
            'repaired_by_name',
            'credit_due',
            'credit_paid'

        ]

    def get_repaired_by_name(self, obj):
        return obj.repaired_by.user.name if obj.repaired_by and obj.repaired_by.user else None

class StaffRepairSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repair
        exclude = ['repair_cost_price','cost_price_description','repair_profit','technician_profit','my_profit','outside_cost']

