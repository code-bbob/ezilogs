from django.db import models
from datetime import datetime
from enterprise.models import Enterprise,Outside
import random
import string
from django.db.models import Q
from django.apps import apps
# from django.conf import settings

# Create your models here.

class Repair(models.Model):

    status_choices = [
        ("Not repaired", "Not repaired"),
        ("Repaired","Repaired"),
        ("Unrepairable","Unrepairable"),
        ("Outrepaired", "Outrepaired"),
        ("Completed","Completed"),
        ("Returned","Returned"),
        ("Credited","Credited")
    ]

    accessory_choices = [
        ("Present","Present"),
        ("Absent","Absent"),
    ]

    # company = models.CharField(max_length=30)
    repair_id = models.CharField(max_length=8,blank=True)
    customer_name = models.CharField(max_length=30)
    customer_phone_number = models.CharField(max_length=10)
    phone_model = models.CharField(max_length=30)
    repair_problem = models.CharField(max_length=50)
    repair_description = models.TextField(null=True, blank=True)
    imei_number = models.CharField(max_length=30,null=True, blank=True)
    # model_number = models.CharField(max_length=30,null=True, blank=True)
    sim_tray =models.CharField(max_length=20,choices=accessory_choices,default="Present")
    sim = models.CharField(max_length=20,choices=accessory_choices,default="Absent")
    SD_card = models.CharField(max_length=20,choices=accessory_choices,default="Absent")
    phone_cover = models.CharField(max_length=20,choices=accessory_choices,default="Absent")
    # phone_condition = models.CharField(max_length=30,null=True, blank=True)
    total_amount = models.IntegerField()
    advance_paid = models.IntegerField()
    due = models.IntegerField()
    received_date = models.DateField(default=datetime.now)
    received_by = models.CharField(max_length=30)
    repaired_by = models.ForeignKey('enterprise.Person',limit_choices_to=Q(role='Technician') | Q(role='Admin'), null=True, blank=True, on_delete=models.SET_NULL) #same enterprise ko lagi
    outside_repair = models.BooleanField(default=False)
    repair_status=models.CharField(max_length=20,choices=status_choices,default="Not repaired",blank=True)
    amount_paid = models.FloatField(null=True,blank=True)
    repair_cost_price = models.FloatField(null=True,blank=True)
    # cost_price_description = models.CharField(max_length=50,null=True,blank=True)
    # cost_item = models.ManyToManyField('inventory.Item',blank=True)
    repair_profit = models.FloatField(null=True,blank=True)
    technician_profit = models.FloatField(null=True,blank=True)
    my_profit = models.FloatField(null=True, blank=True)
    admin_only_profit = models.FloatField(null=True,blank=True)
    outside = models.ForeignKey(Outside, null=True, blank=True,on_delete=models.CASCADE)
    outside_name = models.CharField(max_length=30,null=True,blank=True)
    outside_desc = models.CharField(max_length=30,null=True,blank=True)
    taken_by = models.CharField(max_length=30,null=True,blank=True)
    outside_taken_date = models.DateField(null = True,blank=True)
    returned_by = models.CharField(max_length=30,null=True,blank=True)
    outside_returned_date = models.DateField(null=True,blank=True)
    outside_cost = models.FloatField(null=True, blank=True)
    delivery_date = models.DateField(default=datetime.now,null=True,blank=True)
    credit_due = models.IntegerField(null=True,blank=True)
    credit_paid = models.IntegerField(null = True, blank = True)
    updated_at = models.DateTimeField(null=True,blank=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # Check if the instance is new
            self.repair_id = self.generate_unique_repair_id()

        self.updated_at = datetime.now()

        if self.pk:
            original = Repair.objects.get(pk=self.pk)
            if original.repair_status != "Completed" and self.repair_status == "Completed":
                self.amount_paid = (self.amount_paid or 0) + self.advance_paid    

            if original.repair_status != "Credited" and self.repair_status == "Credited":
                print(self.amount_paid)
                print(self.credit_due)
                print(self.repair_cost_price)
                self.repair_profit = self.amount_paid + self.credit_due - self.repair_cost_price
                Credit = apps.get_model('transactions', 'Credit')
                creditor = Credit.objects.get(repair = self)
                creditor.due = creditor.due + self.credit_due
                creditor.save()

                if self.outside_repair: 
                    self.repair_profit = self.repair_profit - self.outside_cost
                    self.admin_only_profit = self.repair_profit
                    self.technician_profit = 0
                else:
                    enterprises = self.enterprise_repairs.all()
                    if not enterprises:
                        self.technician_profit = 0
                        self.my_profit = self.repair_profit  # Or any other default value


                        #definitely do sth about this
                    else:
                        repaired_by = self.repaired_by
                        if repaired_by.role == "Admin":
                            self.admin_only_profit = self.repair_profit
                            self.technician_profit = 0
                        else:
                            tech = self.repaired_by
                            self.technician_profit = (tech.technician_profit / 100) * self.repair_profit
                            print(tech.technician_profit)
                            self.my_profit = ((100 - tech.technician_profit) / 100) * self.repair_profit
                            tech.due = tech.due + (tech.technician_profit / 100) * self.repair_profit
                            tech.save()

            if original.repair_status == "Credited" and self.repair_status == "Credited":
                CreditTransaction = apps.get_model('transactions', 'CreditTransaction')
                Credit = apps.get_model('transactions', 'Credit')
                creditor = Credit.objects.get(repair = self)
                enterprise = Enterprise.objects.get(repairs = self)
                CreditTransaction.objects.create(
                    repair = self,
                    transaction_from = creditor,
                    enterprise = enterprise,
                    amount = self.credit_paid,
                    date = self.updated_at
                )
                self.amount_paid = self.credit_paid + self.amount_paid
                self.credit_due = self.credit_due - self.credit_paid
                self.credit_paid = 0
                if self.credit_due == 0:
                    self.repair_status = "Completed"
                creditor.due = creditor.due - self.credit_paid
                creditor.save()

                # CreditTransaction.objects.create(repair=self,transaction_from = )

            

        if self.repair_status=="Completed":
            if self.credit_due:
                self.amount_paid = self.amount_paid + self.credit_paid
                self.credit_due = self.credit_due - self.credit_paid
                self.credit_paid = 0

            print("Here")
            print(self.amount_paid)
            print(self.repair_cost_price)
            self.repair_profit = self.amount_paid - self.repair_cost_price
            
            if self.outside_repair: 
                self.repair_profit = self.repair_profit - self.outside_cost
                self.admin_only_profit = self.repair_profit
                self.technician_profit = 0
            else:
                enterprises = self.enterprise_repairs.all()
                if not enterprises:
                    print("hereerere")
                    self.technician_profit = 0
                    self.my_profit = self.repair_profit  # Or any other default value
                else:
                    enterprise = enterprises.first()  # Get the first related enterprise, adjust as needed
                    repaired_by = self.repaired_by
                    if repaired_by.role == "Admin":
                        self.admin_only_profit = self.repair_profit
                        self.technician_profit = 0
                    else:
                        tech = self.repaired_by
                        self.technician_profit = (tech.technician_profit / 100) * self.repair_profit
                        self.my_profit = ((100 - tech.technician_profit) / 100) * self.repair_profit
                        tech.due = tech.due + (tech.technician_profit / 100) * self.repair_profit
                        print("##########################################")
                        tech.save()
                # self.technician_profit = (self.enterprise.technician_profit / 100) * self.repair_profit
                # self.my_profit = ((100-self.enterprise.technician_profit) / 100) * self.repair_profit
        super(Repair, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.delivery_date and (datetime.now().date() - self.delivery_date).days <= 7:
            print("deleting")
            items = self.repair_items.all()
            print(items)
            for item in items:
                item.item.quantity += item.quantity
                item.item.save()
            print("DONE")
            tech = self.repaired_by
            if tech and self.technician_profit:
                tech.due -= self.technician_profit
                tech.save()
        super(Repair, self).delete(*args, **kwargs)

    def generate_unique_repair_id(self,length=8):
        characters = string.ascii_letters + string.digits
        while True:
            repair_id = ''.join(random.choice(characters) for _ in range(length))

            if not Repair.objects.filter(repair_id=repair_id).exists():
                return repair_id

    def __str__(self):
        return f"{self.phone_model} by {self.customer_name}"
    

class RepairItem(models.Model):
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE)
    repair = models.ForeignKey(Repair, on_delete=models.CASCADE,related_name='repair_items')
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.item} for {self.repair}"
    
