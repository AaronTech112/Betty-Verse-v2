import smtplib
import socket
import ssl

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.mail.backends.smtp import EmailBackend as SMTPEmailBackend

try:
    import certifi
except Exception:  # pragma: no cover - optional dependency fallback
    certifi = None


class IPv4SMTP(smtplib.SMTP):
    """Prefer IPv4 when connecting to SMTP servers to avoid IPv6 timeouts in serverless runtimes."""

    def _get_socket(self, host, port, timeout):
        last_err = None
        connect_timeout = 4.0 if timeout is socket._GLOBAL_DEFAULT_TIMEOUT or not timeout else min(float(timeout), 4.0)
        for family in (socket.AF_INET, socket.AF_UNSPEC):
            try:
                for res in socket.getaddrinfo(host, port, family, socket.SOCK_STREAM):
                    af, socktype, proto, _canonname, sa = res
                    sock = None
                    try:
                        sock = socket.socket(af, socktype, proto)
                        sock.settimeout(connect_timeout)
                        if self.source_address:
                            sock.bind(self.source_address)
                        sock.connect(sa)
                        if timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                            sock.settimeout(timeout)
                        return sock
                    except OSError as err:
                        last_err = err
                        if sock is not None:
                            sock.close()
            except OSError as err:
                last_err = err
        if last_err is not None:
            raise last_err
        raise OSError("getaddrinfo returns an empty list")


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
    def connection_class(self):
        return smtplib.SMTP_SSL if self.use_ssl else IPv4SMTP

    @property
    def ssl_context(self):
        if certifi is not None:
            return ssl.create_default_context(cafile=certifi.where())
        return ssl.create_default_context()
