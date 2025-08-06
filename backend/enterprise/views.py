from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from repair.models import Repair
from repair.permissions import check_status
from django.utils.dateparse import parse_date
from datetime import datetime, date
from .serializers import AdminProfitSerializer,TechnicianProfitSerializer,OutsideRepairSerializer,PersonSerializer
from .models import Person,Outside

class EnterpriseProfit(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        repairs = Repair.objects.filter(enterprise_repairs__name=enterprise,repair_status="Completed").order_by('-updated_at')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        technician = request.GET.get('tech')
        status = check_status(user)


        # If start_date or end_date is not provided, use the start of the current month
        if not start_date or not end_date:
            today = date.today()
            start_date = today.replace(day=1)  # First day of the current month
            end_date = today

        # Parse the dates
        start_date = parse_date(start_date) if isinstance(start_date, str) else start_date
        end_date = parse_date(end_date) if isinstance(end_date, str) else end_date

        # Filter repairs by the date range
        if start_date and end_date:
            repairs = repairs.filter(delivery_date__range=(start_date, end_date))

        if technician:
            repairs = repairs.filter(repaired_by = technician)

        # Return the profits based on user status
        if status == "Admin":
             # Initialize total profits
            total_profit = 0
            technician_profit = 0
            my_profit = 0
            admin_only_profit = 0

            for repair in repairs:
                if repair.repair_profit:
                    total_profit += repair.repair_profit
                if repair.technician_profit:
                    technician_profit += repair.technician_profit
                if repair.my_profit:
                    my_profit += repair.my_profit
                if repair.admin_only_profit:
                    admin_only_profit += repair.admin_only_profit
            profit = AdminProfitSerializer(repairs,many=True)

            return Response({"total_profit": total_profit, "technician_profit": technician_profit, "my_profit": my_profit,"admin_only_profit":admin_only_profit,"data":profit.data})


        elif status == "Technician":
            user=user.id
            total_profit = 0
            technician_profit = 0
            # if (technician != user.person):
            #     return Response("UNAUTHORIZED")
            repairs = repairs.filter(repaired_by=user)
            for repair in repairs:
                total_profit += repair.repair_profit
                technician_profit += repair.technician_profit
            profit = TechnicianProfitSerializer(repairs,many=True)

            return Response({"total_profit": total_profit, "technician_profit": technician_profit,"data":profit.data})

        else:
            return Response({"message": "No profit data available for your role"}, status=status.HTTP_400_BAD_REQUEST)


class TechniciansView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user= request.user
        enterprise = user.person.enterprise
        #return resposne of every technicians and admins name and user id
        persons = Person.objects.filter(enterprise=enterprise, role__in=['Technician', 'Admin']).values('user__id', 'user__name', 'role','due')
        response_data = [
            {

                'user_id': person['user__id'],
                'name': person['user__name'],
                'role': person['role'],
                'due' : person['due']
            } for person in persons
        ]

        return Response(response_data)



class OutsideView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        enterprise = user.person.enterprise
        status = check_status(user)
        if (status == "Admin" or status == "Technician"):
            outsides = Outside.objects.filter(enterprise=enterprise)
            serializer = OutsideRepairSerializer(outsides,many=True)
            return Response(serializer.data)


    def post(self,request):
        user = request.user
        enterprise = user.person.enterprise
        status = check_status(user)
        if status == "Admin":
            data = request.data
            data["enterprise"]=enterprise.id
            serializer = OutsideRepairSerializer(data = data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data)

class PersonView(APIView):
    persmission_classes = [IsAuthenticated]

    def get(self,request):
        user= request.user
        enterprise = user.person.enterprise
        persons = Person.objects.filter(enterprise=enterprise)
        serializer = PersonSerializer(persons,many=True)
        return Response(serializer.data)

    def post(self,request):
        user = request.user
        data = request.data
        status = check_status(user)
        if status == "Admin":
            enterprise = user.person.enterprise.id
            data["enterprise"] = enterprise
            serializer = PersonSerializer(data=data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data)
        else:
            return Response("UNAUTHORIZED")

    def patch(self,request):
        user = request.user
        data = request.data
        id = data.get('id',None)
        if id:
            if check_status(user)=="Admin":
                person = Person.objects.get(user = id,enterprise = user.person.enterprise)
                if person:
                    serializer = PersonSerializer(person,data=data,partial=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()
                        return Response(serializer.data)
            else:
                return Response("NOT AUTHORIZED")
        else:
            return Response("NO SUCH TECHNICIAN")
