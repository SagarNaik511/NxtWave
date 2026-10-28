from django.urls import path

from .views import RegistrationCreateView

urlpatterns = [
    path("", RegistrationCreateView.as_view(), name="registration-create"),
]

