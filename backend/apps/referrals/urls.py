from django.urls import path

from .views import ReferralValidationView

urlpatterns = [
    path("validate/<str:referral_code>/", ReferralValidationView.as_view(), name="referral-validation"),
]

