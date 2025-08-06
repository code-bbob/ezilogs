# def check_status(user):
#     group = user.groups.first()
#     return group.name
from enterprise.models import Person

def check_status(user):
    person=Person.objects.filter(user=user).first()
    role = person.role
    return role