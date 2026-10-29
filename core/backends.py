import ssl

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.mail.backends.smtp import EmailBackend as SMTPEmailBackend

try:
    import certifi
except Exception:  # pragma: no cover - optional dependency fallback
    certifi = None


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user_model = get_user_model()
        login_value = (username or kwargs.get(user_model.USERNAME_FIELD) or "").strip()
        if not login_value or not password:
            return None

        user = user_model.objects.filter(email__iexact=login_value).first()
        if user is None:
            user = user_model.objects.filter(username__iexact=login_value).first()

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


class CertifiSMTPEmailBackend(SMTPEmailBackend):
    @property
    def ssl_context(self):
        if certifi is not None:
            return ssl.create_default_context(cafile=certifi.where())
        return ssl.create_default_context()
