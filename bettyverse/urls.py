"""
URL configuration for bettyverse project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include, re_path
from django.views.static import serve


def serve_media(request, path):
    from core.models import MediaFile

    clean_path = str(path or "").replace("\\", "/").lstrip("/")
    if clean_path:
        media = MediaFile.objects.filter(name=clean_path).first()
        if media is not None:
            response = HttpResponse(
                bytes(media.content),
                content_type=media.content_type or "application/octet-stream",
            )
            response["Cache-Control"] = "public, max-age=86400"
            return response

    return serve(request, path, document_root=settings.MEDIA_ROOT)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    re_path(r'^media/(?P<path>.*)$', serve_media),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]
