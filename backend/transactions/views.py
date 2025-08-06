from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Transaction
from repair.permissions import check_status
from django.utils.dateparse import parse_date
from .serializers import TransactionSerializer
from enterprise.models import Person,Enterprise
from userauth.models import User
from rest_framework import status
from transactions.models import Credit,CreditTransaction
from repair.models import Repair
from repair.serializers import AdminRepairSerializer
from .serializers import CreditSerializer,CreditTransactionSerializer
from django.db import transaction
from rest_framework.pagination import PageNumberPagination


# Create your views here.

class TransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        enterprise = user.person.enterprise
        transactions = Transaction.objects.filter(enterprise=enterprise)
        transactions = transactions.order_by('-id')
        status = check_status(user)
        if status == "Admin":
            paginator = PageNumberPagination()
            paginator.page_size = 10  # Set the page size here
            paginated_transactions = paginator.paginate_queryset(transactions, request)
            serializer = TransactionSerializer(paginated_transactions, many=True)
            return paginator.get_paginated_response(serializer.data)
        elif status == "Technician":
            transactions = transactions.filter(transaction_to=user.person)
            paginator = PageNumberPagination()
            paginator.page_size = 10
            paginated_transactions = paginator.paginate_queryset(transactions, request)
            serializer = TransactionSerializer(paginated_transactions, many=True)
            return paginator.get_paginated_response(serializer.data)

        else:
            return Response("Unauthorized")

    @transaction.atomic
    def post(self,request):
        user=request.user
        data = request.data
        from_id = request.data.get('transaction_from')
        to_id = request.data.get('transaction_to')
        amount = request.data.get('amount')
        sender = User.objects.get(id = from_id)
        sender = sender.person
        receiver = User.objects.get(id = to_id)
        receiver = receiver.person
        enterprise = user.person.enterprise
        data["enterprise"] = enterprise.id
        if check_status(sender) == 'Admin':
            serializer = TransactionSerializer(data = data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
            if amount:
                if receiver.due:
                    receiver.due = receiver.due - amount
                    print(receiver.due)
                else:
                    receiver.due = -(amount)
                receiver.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({"msg":"Not ok"},)
        else:
            return Response({"msg":"You are not authorized"})

    def delete(self,request):
        transaction_id = request.data.get('transaction_id',None)
        transaction = Transaction.objects.get(id=transaction_id)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class SearchTransactionView(APIView):
    def get(self,request):
        user = request.user
        enterprise= user.person.enterprise
        search = request.GET.get('q')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        transactions = Transaction.objects.filter(enterprise=enterprise)
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            if start_date and end_date:
                transactions = transactions.filter(date__range=(start_date, end_date))

        if search:
            if len(search)>40:
                transactions=Transaction.objects.none()
            else:
                transaction_from_name= transactions.filter(transaction_from__user__name__icontains=search)
                transaction_to_name= transactions.filter(transaction_to__user__name__icontains=search)#__name is used to address a particular name field of the foreign key so __sth__name means the foreign key has a foreign key sth that has the field name
                transaction_desc = transactions.filter(desc__icontains=search)
                transactions = transaction_from_name.union(transaction_to_name,transaction_desc)
            if not transactions:
                return Response("NONE")
        status = check_status(user)
        transactions = transactions.order_by('-id')

        if status == "Admin":
            serializer = TransactionSerializer(transactions,many=True)
            return Response(serializer.data)
        else:
            return Response("Not Authorized")

class CreditView(APIView):
    permission_classes = [IsAuthenticated]


    def get(self,request,pk=None):
        user = request.user
        enterprise = user.person.enterprise
        status = check_status(user)

        if status == "Admin":
            credits = Credit.objects.filter(enterprise=enterprise)
            if credits:
                credit_serializer = CreditSerializer(credits,many=True)
                return Response({"credits":credit_serializer.data})

            if pk:
                credit = Credit.objects.get(id = pk)
                if credit:
                    credit_serializer = CreditSerializer(credit)

                else:
                    return Response("NONE")
            # credit_repairs = Repair.objects.filter(repair_status = "Credited",enterprise_repairs__name=enterprise)
            # if credit_repairs:
            #     credit_repairs_serializer = AdminRepairSerializer(credit_repairs,many=True)
            # if credits and credit_repairs:
            #     return Response({"credits":credit_serializer.data,"credit_repairs":credit_repairs_serializer.data})
            # elif credits and not credit_repairs:
                return Response({"credits":credit_serializer.data})
            else:
                return Response("NONE")

    def post(self,request):
        user = request.user
        enterprise = user.person.enterprise
        status = check_status(user)
        if status == "Admin":
            data = request.data
            data["enterprise"] = enterprise.id
            serializer = CreditSerializer(data = data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data)

    def delete(self,request):
        user = request.user
        enterprise= user.person.enterprise
        user_status = check_status(user)
        if user_status == "Admin":
            credit_id = request.data.get('credit_id',None)
            credit = Credit.objects.get(id = credit_id,enterprise=enterprise)
            credit.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)



class CreditTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        enterprise=user.person.enterprise
        creditor = request.GET.get('creditor')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        status = check_status(user)
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            print("HERERERE")
        if status == "Admin":
            credit_transactions = CreditTransaction.objects.filter(enterprise=enterprise)
            if creditor:
                credit_transactions = credit_transactions.filter(transaction_from=creditor)
            if start_date and end_date:
                credit_transactions = credit_transactions.filter(date__range=(start_date, end_date))
                print("POPOPOPP",credit_transactions)
            serializer=CreditTransactionSerializer(credit_transactions,many=True)
            return Response(serializer.data)

