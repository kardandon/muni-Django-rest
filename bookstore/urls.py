from django.conf.urls import url
from django.urls import path, include
from rest_framework.viewsets import GenericViewSet

from . import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register("booklist", views.GenericAPIViewset, basename="booklist")
router.register("usercreate", views.UserCreateViewsetAPI, basename="usercreate")
router.register("user", views.UserViewsetAPI, basename="user")
router.register("comments", views.CommentsViewset, basename="comments")
router.register("watchlist", views.WatchlistViewset, basename="watchlist")

urlpatterns = [
    url('swagger', views.schema_view),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/", include(router.urls)),
    path("", views.index, name="index"),
]

    
    