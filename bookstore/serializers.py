from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super(MyTokenObtainPairSerializer, cls).get_token(user)

        # Add custom claims
        token['username'] = user.username
        return token

class Book_ListSerializer(serializers.ModelSerializer):
    Categoryy = serializers.ReadOnlyField(source='Category.Category_name')
    Authorr = serializers.ReadOnlyField(source='Author.Author_name')
    Publisherr = serializers.ReadOnlyField(source='Publisher.Publisher_name')
    listerr = serializers.ReadOnlyField(source='lister.username')
    class Meta:
        model = Book_List
        #fields = ["id", "Name", "Description", "Date", "Location", "lister", "Category", "Author", "Publisher", "Pic_url"]
        fields = "__all__"

class CommentSerializer(serializers.ModelSerializer):
    Commentor_name = serializers.ReadOnlyField(source='Commentor.username')
    
    class Meta:
        model = Comment
        #fields = ["id", "Name", "Description", "Date", "Location", "lister", "Category", "Author", "Publisher", "Pic_url"]
        fields = "__all__"

class WatchlistSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Watchlist
        #fields = ["id", "Name", "Description", "Date", "Location", "lister", "Category", "Author", "Publisher", "Pic_url"]
        fields = "__all__"

class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
        )
        return user

    class Meta:
        model = User
        fields = ( "id", "email", "username", "password", )