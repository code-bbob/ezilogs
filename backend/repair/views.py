from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics
from .models import Repair
from rest_framework.response import Response
from .serializers import AdminRepairSerializer,TechnicianRepairSerializer,StaffRepairSerializer
from .permissions import check_status
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils.dateparse import parse_date

from transactions.models import Credit
# Create your views here.
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count

class RepairView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repair_status = request.GET.get('status')
        stat = request.GET.get('stat')
        print(repair_status)
        user = request.user
        enterprise = user.person.enterprise
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        repairs = Repair.objects.filter(enterprise_repairs__name=enterprise).order_by('-updated_at')
        if stat:
            pending_repairs = repairs.filter(repair_status="Not repaired").count()
            unrepairable_repairs = repairs.filter(repair_status="Unrepairable").count()
            outside_repairs = repairs.filter(repair_status="Outrepaired").count()
            print(pending_repairs,unrepairable_repairs,outside_repairs)
            status = check_status(user)

        # Set up pagination
            paginator = PageNumberPagination()
            paginator.page_size = 10  # Set the page size here
            paginated_repairs = paginator.paginate_queryset(repairs, request)

            # Serialize the paginated data
            if status == "Admin":
                serializer = AdminRepairSerializer(paginated_repairs, many=True)
            elif status == "Technician":
                serializer = TechnicianRepairSerializer(paginated_repairs, many=True)
            else:
                serializer = StaffRepairSerializer(paginated_repairs, many=True)

            # Return paginated response
            return paginator.get_paginated_response(serializer.data)

        if repair_status:
            repairs = repairs.filter(repair_status = repair_status)
        status = check_status(user)

        # Set up pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10  # Set the page size here
        paginated_repairs = paginator.paginate_queryset(repairs, request)

        # Serialize the paginated data
        if status == "Admin":
            serializer = AdminRepairSerializer(paginated_repairs, many=True)
        elif status == "Technician":
            serializer = TechnicianRepairSerializer(paginated_repairs, many=True)
        else:
            serializer = StaffRepairSerializer(paginated_repairs, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

    def post(self,request):
        data = request.data
        serializer = AdminRepairSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            user = request.user
            enterprise = user.person.enterprise
            obj = serializer.save()     #ALWAYS REMEMBER U FIRST NEED IT TO BE SAVED TO ADD
            enterprise.repairs.add(obj)
            return Response(serializer.data)

    def patch(self,request):
        repair_id = request.data.get('repair_id',None)
        print("HERE",repair_id)
        repair = Repair.objects.get(repair_id=repair_id)
        print("Not HERE",repair)
        data=request.data
        credit_id = request.data.get('credit_id',None)
        if check_status(request.user) != "Admin":
            return Response("Unauthorized")

        if credit_id:
            credit = Credit.objects.get(id = credit_id)
            credit.repair.add(repair)

        if repair:
            serializer = AdminRepairSerializer(repair, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"No repair found"})

    def delete(self,request):
        repair_id = request.data.get('repair_id',None)
        repair = Repair.objects.get(repair_id=repair_id)
        repair.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CountStat(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        enterprise = user.person.enterprise
        repairs = Repair.objects.filter(enterprise_repairs__name=enterprise).order_by('-updated_at')
        pending_repairs = repairs.filter(repair_status="Not repaired").count()
        unrepairable_repairs = repairs.filter(repair_status="Unrepairable").count()
        outside_repairs = repairs.filter(repair_status="Outrepaired").count()
        print(pending_repairs,unrepairable_repairs,outside_repairs)
        status = check_status(user)
        if status == "Admin" or status == "Technician":
            return Response({"pending":pending_repairs,"unrepairable":unrepairable_repairs,"outside":outside_repairs})
        else:
            return Response("UNAUTHORIZED")

class SearchView(APIView):

    permission_classes=[IsAuthenticated]

    def get(self,request):
        search = request.GET.get('q')
        user = request.user
        enterprise = user.person.enterprise
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        repairs = Repair.objects.filter(enterprise_repairs__name=enterprise)
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            if start_date and end_date:
                repairs = repairs.filter(received_date__range=(start_date, end_date))

        if search:
            if len(search)>40:
                repairs=Repair.objects.none()
            else:
                repair_customer_name= repairs.filter(customer_name__icontains=search)
                repair_phone_model= repairs.filter(phone_model__icontains=search)
                repair_id =repairs.filter(repair_id__exact=search)
                repair_customer_phone_number = repairs.filter(customer_phone_number__icontains=search)
                repairs=  repair_customer_name.union(repair_customer_phone_number,repair_phone_model,repair_id)
            if not repairs:
                return Response("NONE")
        status = check_status(user)
        repairs = repairs.order_by('-updated_at')
        if status == "Admin":
            serializer = AdminRepairSerializer(repairs,many=True)
        elif status == "Technician":
            serializer = TechnicianRepairSerializer(repairs,many=True)
        else:
            serializer = StaffRepairSerializer(repairs,many=True)
        return Response(serializer.data)

