from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(User)
admin.site.register(Star)
admin.site.register(Watchlist)
admin.site.register(Comment)
admin.site.register(Book_List)
admin.site.register(Publisher)
admin.site.register(Author)
admin.site.register(Category)