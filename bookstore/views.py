from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, request
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http.response import JsonResponse
from django.db.models import Q
from rest_framework import permissions
from rest_framework.parsers import JSONParser
import json
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from .serializers import *
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework import generics, mixins, status, viewsets

from .models import *
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_swagger.views import get_swagger_view

schema_view = get_swagger_view(title='Pastebin API')


class MyObtainTokenPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = MyTokenObtainPairSerializer


class Get_only(IsAuthenticated):

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            if view.action == 'list' or view.action == "retrieve":
                return True
            else:
                return False
        else:
            return True

# Create your views here.
def index(request):
    return render(request, "bookstore/index.html")

class WatchlistViewset(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    serializer_class = WatchlistSerializer
    queryset = Watchlist.objects.all()
    lookup_field = "books"
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        validated_data = request.data
        validated_data["user_info"] = request.user.id
        return super().destroy(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        books = Watchlist.objects.filter(user_info=request.user.id).all()
        data = [{"id": dat.books.id, "name": dat.books.Name, "category": dat.books.Category.Category_name, "author": dat.books.Author.Author_name} for dat in books]
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_200_OK, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        id = kwargs["books"]
        books = Watchlist.objects.filter(user_info=request.user.id, books=id).all()
        data = {"is_watchlisted": len(books) != 0}
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_200_OK, headers=headers)
    
    def create(self, request, *args, **kwargs):
        validated_data = request.data
        validated_data["user_info"] = request.user.id
        return super().create(request, *args, **kwargs)
    
    
class CommentsViewset(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    serializer_class = CommentSerializer
    queryset = Comment.objects.all()
    lookup_field = "id"
    permission_classes = [Get_only]
    def create(self, request, *args, **kwargs):
        validated_data = request.data
        validated_data["Commentor"] = request.user.id
        serializer = self.get_serializer(data=validated_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def list(self, request, *args, **kwargs):
        id = request.GET.get("book")
        
        data = Comment.objects.filter(Book=Book_List.objects.get(pk=id)).order_by("-timestamp")[0:10]
        data = [{"id": dat.id, "Commentor": dat.Commentor.username, "comment": dat.Comment, "timestamp": dat.timestamp} for dat in data]
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_200_OK, headers=headers)

class GenericAPIViewset(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    serializer_class = Book_ListSerializer
    queryset = Book_List.objects.all()
    lookup_field = "id"
    permission_classes = [Get_only]

    
    def create(self, request, *args, **kwargs):
        validated_data = request.data
        category = Category.objects.filter(Category_name=validated_data["Category"]).all()
        if len(category) == 0: 
            category = Category.objects.create(Category_name=validated_data["Category"])
            category.save()
        else: category = category[0]
        category = category.id
        author = Author.objects.filter(Author_name=validated_data["Author"]).all()
        if len(author) == 0: 
            author = Author.objects.create(Author_name=validated_data["Author"])
            author.save()
        else: author = author[0]
        author = author.id
        publisher = Publisher.objects.filter(Publisher_name=validated_data["Publisher"]).all()
        if len(publisher) == 0: 
            publisher = Publisher.objects.create(Publisher_name=validated_data["Publisher"])
            publisher.save()
        else: publisher = publisher[0]
        publisher = publisher.id
        validated_data["lister"] = request.user.id
        validated_data["Category"] = category
        validated_data["Author"] = author
        validated_data["Publisher"] = publisher
        serializer = self.get_serializer(data=validated_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save()
    
    def list(self, request, *args, **kwargs):
        name = request.GET.get("name")
        name = "" if name == None else name
        category = request.GET.get("category")
        category = "" if category == None else category
        author = request.GET.get("author")
        author = "" if author == None else author
        filt1 = Category.objects.filter(Category_name__contains=category)
        filt2 = Author.objects.filter(Author_name__contains=author)
        data = Book_List.objects.filter(Q(Name__contains=name) & Q(Category__in=filt1) & Q(Author__in=filt2))[0:10]
        data = [{"id": dat.id, "name": dat.Name, "category": dat.Category.Category_name, "author": dat.Author.Author_name} for dat in data]
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_200_OK, headers=headers)
    
    def update(self, request, *args, **kwargs):
        id = kwargs["id"]
        validated_data = request.data
        category = Category.objects.filter(Category_name=validated_data["Category"]).all()
        if len(category) == 0: 
            category = Category.objects.create(Category_name=validated_data["Category"])
            category.save()
        else: category = category[0]
        category = category.id
        author = Author.objects.filter(Author_name=validated_data["Author"]).all()
        if len(author) == 0: 
            author = Author.objects.create(Author_name=validated_data["Author"])
            author.save()
        else: author = author[0]
        author = author.id
        publisher = Publisher.objects.filter(Publisher_name=validated_data["Publisher"]).all()
        if len(publisher) == 0: 
            publisher = Publisher.objects.create(Publisher_name=validated_data["Publisher"])
            publisher.save()
        else: publisher = publisher[0]
        publisher = publisher.id
        request.data["Category"] = category
        request.data["Author"] = author
        request.data["Publisher"] = publisher
        request.data["lister"] = request.user.id
        return super().update(request, *args, **kwargs)



class UserCreateViewsetAPI(viewsets.GenericViewSet, mixins.CreateModelMixin):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "id"

class UserViewsetAPI(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "id"
    permission_classes = [IsAdminUser]
