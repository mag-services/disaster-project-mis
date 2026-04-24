from django.urls import path

from . import views

app_name = "land_accounts"

urlpatterns = [
    path("land-accounts/", views.LandAccountsView.as_view(), name="land-accounts"),
]
