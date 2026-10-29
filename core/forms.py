from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.forms import UserCreationForm
from django.core.mail import EmailMultiAlternatives
from django.template import loader
from .models import Booking, NewsletterCampaign, User


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    phone = forms.CharField(required=False, max_length=20)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "phone", "password1", "password2")

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.phone = self.cleaned_data.get("phone", "")
        if commit:
            user.save()
        return user


class EmailAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(
            attrs={
                "autofocus": True,
                "placeholder": "Email address",
                "autocomplete": "email",
            }
        ),
    )

    error_messages = {
        "invalid_login": (
            "Please enter a correct email and password. Note that both "
            "fields may be case-sensitive."
        ),
        "inactive": "This account is inactive.",
    }


class EmailVerificationForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
                "placeholder": "Email address",
                "autocomplete": "email",
            }
        )
    )
    code = forms.CharField(
        min_length=6,
        max_length=6,
        widget=forms.TextInput(
            attrs={
                "placeholder": "6-digit verification code",
                "inputmode": "numeric",
                "autocomplete": "one-time-code",
                "pattern": "[0-9]{6}",
            }
        ),
    )

    def clean_code(self):
        code = str(self.cleaned_data["code"]).strip()
        if not code.isdigit():
            raise forms.ValidationError("Enter the 6-digit code from your email.")
        return code


class NewsletterSubscriptionForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
                "class": "footer_newsletter_input",
                "placeholder": "Enter your email address",
                "aria-label": "Email address",
                "autocomplete": "email",
            }
        )
    )

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()


class NewsletterCampaignForm(forms.ModelForm):
    class Meta:
        model = NewsletterCampaign
        fields = ("subject", "body")
        widgets = {
            "subject": forms.TextInput(attrs={"placeholder": "Newsletter subject"}),
            "body": forms.Textarea(attrs={"rows": 10, "placeholder": "Write your newsletter email here"}),
        }


class BettyVersePasswordResetForm(PasswordResetForm):
    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()

    def send_mail(
        self,
        subject_template_name,
        email_template_name,
        context,
        from_email,
        to_email,
        html_email_template_name=None,
    ):
        subject = loader.render_to_string(subject_template_name, context)
        subject = "".join(subject.splitlines())
        body = loader.render_to_string(email_template_name, context)
        from_email = from_email or context.get("from_email") or to_email

        message = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=from_email,
            to=[to_email],
            reply_to=[from_email],
        )
        if html_email_template_name:
            html_body = loader.render_to_string(html_email_template_name, context)
            message.attach_alternative(html_body, "text/html")
        message.send()


class BookingRequestForm(forms.ModelForm):
    event_datetime = forms.DateTimeField(
        input_formats=(
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d %H:%M:%S",
        )
    )
    photo_video_permission = forms.ChoiceField(
        choices=(("yes", "Yes"), ("no", "No")),
        required=True,
    )
    travel_fees_ack = forms.BooleanField(required=True)
    deposit_required_ack = forms.BooleanField(required=True)

    class Meta:
        model = Booking
        fields = (
            "full_name",
            "phone",
            "email",
            "event_type",
            "event_datetime",
            "theme",
            "occasion_details",
            "special_requests",
            "property_type",
            "parking_availability",
            "access_instructions",
            "budget",
            "photo_video_permission",
            "inspiration_links",
        )
        widgets = {
            "event_datetime": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }

    def clean_photo_video_permission(self):
        value = self.cleaned_data.get("photo_video_permission")
        return value == "yes"
