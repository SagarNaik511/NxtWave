from django.urls import path

from .management_views import AmbassadorDetailView, AmbassadorManagementView, AmbassadorStatusView
from .views import ReferralValidationView

urlpatterns = [
    path("validate/<str:referral_code>/", ReferralValidationView.as_view(), name="referral-validation"),
    path("ambassadors/", AmbassadorManagementView.as_view(), name="ambassador-management"),
    path("ambassadors/<int:pk>/", AmbassadorDetailView.as_view(), name="ambassador-detail"),
    path(
        "ambassadors/<int:pk>/deactivate/",
        AmbassadorStatusView.as_view(is_active=False),
        name="ambassador-deactivate",
    ),
    path(
        "ambassadors/<int:pk>/activate/",
        AmbassadorStatusView.as_view(is_active=True),
        name="ambassador-activate",
    ),
]

