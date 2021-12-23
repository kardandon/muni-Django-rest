from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.base import Model
from django.db.models.fields import CharField


class User(AbstractUser):
    pass

class Category(models.Model):
    Category_name = CharField(max_length=64, unique=True)
    def __str__(self):
        return f"{self.Category_name}"

class Author(models.Model):
    Author_name = CharField(max_length=64, unique=True)
    def __str__(self):
        return f"{self.Author_name}"

class Publisher(models.Model):
    Publisher_name = CharField(max_length=64, unique=True)
    def __str__(self):
        return f"{self.Publisher_name}"
    
class Book_List(models.Model):
    Active = models.BooleanField(default=True)
    Name = models.CharField(max_length=64)
    Description = models.TextField()
    Date = models.DateField(auto_now=True)
    Location = models.CharField(max_length=64)
    lister = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listed_items")
    Category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="listed_items")
    Author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="listed_items")
    Publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE, related_name="listed_items")
    Pic_url = models.CharField(max_length=1024)
    def __str__(self):
        return f"{self.Name} from {self.Category} listed by {self.lister}"
        
class Watchlist(models.Model):
    books = models.ForeignKey(Book_List, on_delete=models.CASCADE, related_name="watchlisted")
    user_info = models.ForeignKey(User, on_delete=models.CASCADE, related_name="my_watchlist")
    class Meta:
        unique_together = ('books', 'user_info',)
    def __str__(self):
        return f"{self.user_info}: {self.books}"

class Star(models.Model):
    Giver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids")
    Book = models.ForeignKey(Book_List, on_delete=models.CASCADE, related_name="bids")
    Star = models.IntegerField()
    def __str__(self):
        return f"{self.Giver} to {self.Book}: {self.Star} stars"

class Comment(models.Model):
    Commentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    Book = models.ForeignKey(Book_List, on_delete=models.CASCADE, related_name="book_comment")
    Comment = models.CharField(max_length=64)
    timestamp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.Commentor.username}: {self.Comment}"