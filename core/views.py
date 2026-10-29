import json
import importlib
import random
from urllib.parse import urlencode, urlsplit
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.text import slugify
from django.utils import timezone
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import CreateView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.views import LoginView, PasswordResetView
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .forms import (
    BookingRequestForm,
    BettyVersePasswordResetForm,
    CustomUserCreationForm,
    EmailAuthenticationForm,
    EmailVerificationForm,
    NewsletterCampaignForm,
    NewsletterSubscriptionForm,
)
from .models import (
    AddOn,
    Address,
    Booking,
    NewsletterCampaign,
    NewsletterSubscriber,
    Order,
    OrderItem,
    OrderItemAddOn,
    Package,
    User,
)

try:
    import stripe
except Exception:  # pragma: no cover - optional dependency fallback
    stripe = None


VERIFICATION_CODE_TTL_MINUTES = 15


def _get_stripe_sdk():
    global stripe
    if stripe is not None:
        return stripe
    try:
        stripe = importlib.import_module("stripe")
    except Exception:
        return None
    return stripe


def _stripe_value(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _mark_order_paid(order):
    if not order:
        return None
    if order.status != "paid":
        order.status = "paid"
        order.save(update_fields=["status"])
    return order


def _sync_paid_order_from_stripe_session(user, session_id):
    normalized_session_id = str(session_id or "").strip()
    if not normalized_session_id:
        return None, ""

    stripe_sdk = _get_stripe_sdk()
    if stripe_sdk is None or not settings.STRIPE_SECRET_KEY:
        return None, ""

    stripe_sdk.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe_sdk.checkout.Session.retrieve(normalized_session_id)
    except Exception as exc:
        return None, str(exc)

    payment_status = _stripe_value(session, "payment_status")
    if payment_status != "paid":
        return None, ""

    metadata = _stripe_value(session, "metadata", {}) or {}
    session_user_id = str(metadata.get("user_id") or "").strip()
    if session_user_id and session_user_id != str(user.id):
        return None, ""

    order_id = metadata.get("order_id") or _stripe_value(session, "client_reference_id")
    if not order_id:
        return None, ""

    order = Order.objects.filter(id=order_id, user=user).first()
    if not order:
        return None, ""

    return _mark_order_paid(order), ""


def _generate_email_verification_code():
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def _issue_email_verification_code(user):
    code = _generate_email_verification_code()
    user.email_verification_code = code
    user.email_verification_sent_at = timezone.now()
    user.save(update_fields=["email_verification_code", "email_verification_sent_at"])
    return code


def _send_email_verification_code(user):
    code = _issue_email_verification_code(user)
    subject = "Your BettyVerse verification code"
    message = (
        f"Hi {user.get_full_name().strip() or user.username},\n\n"
        f"Your BettyVerse verification code is: {code}\n\n"
        f"This code expires in {VERIFICATION_CODE_TTL_MINUTES} minutes.\n"
        "If you did not create this account, you can ignore this email."
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def _email_verification_code_is_valid(user, code):
    sent_at = user.email_verification_sent_at
    if not sent_at or not user.email_verification_code:
        return False
    if user.email_verification_code != str(code).strip():
        return False
    expires_at = sent_at + timedelta(minutes=VERIFICATION_CODE_TTL_MINUTES)
    return timezone.now() <= expires_at


def _get_safe_next_url(request, fallback_name="home"):
    next_url = str(
        request.POST.get("next")
        or request.GET.get("next")
        or request.META.get("HTTP_REFERER")
        or ""
    ).strip()
    if next_url and url_has_allowed_host_and_scheme(next_url, {request.get_host()}, require_https=request.is_secure()):
        return next_url
    return reverse(fallback_name)


def _send_newsletter_campaign(campaign, subscribers):
    sent_count = 0
    for subscriber in subscribers:
        send_mail(
            campaign.subject,
            campaign.body,
            settings.DEFAULT_FROM_EMAIL,
            [subscriber.email],
            fail_silently=False,
        )
        sent_count += 1
    campaign.recipient_count = sent_count
    campaign.sent_at = timezone.now()
    campaign.save(update_fields=["recipient_count", "sent_at"])
    return sent_count


def _send_newsletter_welcome_email(subscriber):
    subject = "Welcome to the BettyVerse newsletter"
    message = (
        f"Hello,\n\n"
        f"Welcome to the BettyVerse newsletter.\n\n"
        f"You are now subscribed with: {subscriber.email}\n\n"
        "You will receive updates about offers, styling trends, and new package launches."
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [subscriber.email],
        fail_silently=False,
    )


def _resolve_package_image_url(package):
    if package.image:
        return package.image.url
    if package.image_url:
        if package.image_url.startswith("http://") or package.image_url.startswith("https://") or package.image_url.startswith("/"):
            return package.image_url
        return "/static/" + package.image_url.lstrip("/")
    return ""


def _get_package_gallery_image_urls(package):
    images = []
    seen = set()

    def add_image(url):
        if not url or url in seen:
            return
        seen.add(url)
        images.append(url)

    add_image(_resolve_package_image_url(package))
    for gallery_image in package.gallery_images.all():
        add_image(_resolve_package_image_url(gallery_image))
    return images


def _normalize_package_filter_category(category):
    normalized = str(category or "").strip().lower()
    if normalized in {"occasion", "proposal", "surprise"}:
        return "surprise"
    return normalized or "all"


def _serialize_package_bootstrap(package):
    package_slug = slugify(package.name)
    gallery_images = _get_package_gallery_image_urls(package)
    return {
        "id": package_slug,
        "packageId": package.id,
        "slug": package_slug,
        "name": package.name,
        "category": package.category,
        "tags": package.tags or "",
        "summary": package.summary,
        "image": gallery_images[0] if gallery_images else "",
        "images": gallery_images,
        "slideImagesJson": json.dumps(gallery_images),
        "basePrice": float(package.base_price),
        "price": float(package.base_price),
        "filterCategory": _normalize_package_filter_category(package.category),
        "addons": [
            {"id": addon.id, "name": addon.name, "price": float(addon.price)}
            for addon in package.addons.all()
        ],
        "selectedAddons": [],
    }


def _package_matches_selected_filter(package_data, selected_filter):
    normalized_filter = _normalize_package_filter_category(selected_filter)
    if normalized_filter == "all":
        return True

    normalized_category = _normalize_package_filter_category(package_data.get("category"))
    if normalized_category == normalized_filter:
        return True

    tags = {
        _normalize_package_filter_category(tag)
        for tag in str(package_data.get("tags") or "").split(",")
        if str(tag).strip()
    }
    return normalized_filter in tags


def _package_matches_search_query(package_data, search_query):
    terms = [term for term in str(search_query or "").strip().lower().split() if term]
    if not terms:
        return True

    haystack = " ".join(
        [
            str(package_data.get("name") or ""),
            str(package_data.get("summary") or ""),
            str(package_data.get("category") or ""),
            str(package_data.get("tags") or ""),
        ]
    ).lower()
    return all(term in haystack for term in terms)


def _build_mixed_home_trending_packages(packages_bootstrap, limit=10):
    if limit <= 0:
        return []

    grouped_packages = {}
    category_order = []
    for package_data in packages_bootstrap:
        category_key = _normalize_package_filter_category(package_data.get("category"))
        if category_key not in grouped_packages:
            grouped_packages[category_key] = []
            category_order.append(category_key)
        grouped_packages[category_key].append(package_data)

    selected = []
    while len(selected) < limit:
        added_in_round = False
        for category_key in category_order:
            category_packages = grouped_packages.get(category_key) or []
            if not category_packages:
                continue
            selected.append(category_packages.pop(0))
            added_in_round = True
            if len(selected) >= limit:
                break
        if not added_in_round:
            break

    return selected


def _get_or_create_cart_order(user):
    order = (
        Order.objects.filter(user=user, status="pending", booking__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if order:
        return order
    return Order.objects.create(user=user, total_price=Decimal("0.00"), status="pending")


def _serialize_cart_order(order):
    items = []
    total = Decimal("0.00")
    order_items = order.items.select_related("package").prefetch_related("selected_addons__addon")

    for item in order_items:
        package = item.package
        if not package:
            continue

        addon_rows = []
        addon_total = Decimal("0.00")
        for selected_addon in item.selected_addons.all():
            addon_total += selected_addon.price
            addon_rows.append(
                {
                    "id": selected_addon.addon_id,
                    "name": selected_addon.addon.name if selected_addon.addon else "Add-on",
                    "price": float(selected_addon.price),
                }
            )

        base_price = item.price or Decimal("0.00")
        line_total = (base_price + addon_total) * item.quantity
        total += line_total

        items.append(
            {
                "id": item.id,
                "package_id": package.id,
                "name": package.name,
                "category": package.category,
                "summary": package.summary,
                "image": _resolve_package_image_url(package),
                "quantity": item.quantity,
                "basePrice": float(base_price),
                "addonTotal": float(addon_total),
                "price": float(base_price + addon_total),
                "addons": addon_rows,
            }
        )

    if order.total_price != total:
        order.total_price = total
        order.save(update_fields=["total_price"])

    return {"items": items, "items_count": len(items), "total": float(total)}


def _build_cart_summary_text(order):
    cart = _serialize_cart_order(order)
    if not cart["items"]:
        return ""

    lines = ["Selected packages from cart:"]
    for item in cart["items"]:
        addon_text = ""
        if item["addons"]:
            addon_text = " | Add-ons: " + ", ".join(
                f'{addon["name"]} (+£{addon["price"]:.2f})' for addon in item["addons"]
            )
        lines.append(f'- {item["name"]} (£{item["price"]:.2f}){addon_text}')
    return "\n".join(lines)


def _read_json_payload(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return {}


def _to_decimal(value, fallback="0.00"):
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(fallback)


def _serialize_address(address):
    return {
        "id": address.id,
        "label": address.label,
        "recipient": address.recipient,
        "phone": address.phone,
        "line1": address.line1,
        "line2": address.line2 or "",
        "city": address.city,
        "region": address.region,
        "postcode": address.postcode,
        "country": address.country,
        "isDefault": bool(address.is_default),
    }


def _serialize_dashboard_profile(user):
    return {
        "id": f"user-{user.pk}",
        "name": user.get_full_name().strip() or user.username,
        "email": user.email or "",
        "phone": user.phone or "",
        "preferredContact": user.preferred_contact or "email",
        "birthday": user.birthday.isoformat() if user.birthday else "",
        "eventPreferences": user.event_preferences or "",
        "notes": user.notes or "",
        "loyaltyTier": user.tier or "Standard",
        "memberSince": user.date_joined.date().isoformat() if user.date_joined else "",
        "avatar": "/static/images/logo.png",
    }


def _serialize_dashboard_orders(user):
    orders = (
        Order.objects.filter(user=user)
        .exclude(status="pending", booking__isnull=True)
        .prefetch_related("items__package", "items__selected_addons__addon")
        .order_by("-created_at")[:20]
    )
    rows = []
    for order in orders:
        item_count = order.items.count()
        first_item = order.items.first()
        summary = first_item.package.name if first_item and first_item.package else "Package order"
        rows.append(
            {
                "id": f"ORD-{order.id}",
                "date": order.created_at.date().isoformat(),
                "total": float(order.total_price),
                "status": order.get_status_display(),
                "items": item_count,
                "summary": summary,
            }
        )
    return rows


def _serialize_dashboard_bookings(user):
    bookings = Booking.objects.filter(user=user).order_by("-created_at")[:20]
    rows = []
    for booking in bookings:
        related_order = (
            Order.objects.filter(user=user, booking=booking)
            .prefetch_related("items__package")
            .first()
        )
        package_name = "Custom Package"
        if related_order and related_order.items.first() and related_order.items.first().package:
            package_name = related_order.items.first().package.name
        rows.append(
            {
                "id": f"BK-{booking.id}",
                "eventType": booking.event_type,
                "eventDate": booking.event_datetime.date().isoformat(),
                "createdAt": booking.created_at.date().isoformat(),
                "venue": booking.property_type.title(),
                "packageName": package_name,
                "guestCount": 0,
                "status": booking.get_status_display(),
                "notes": booking.special_requests or "No additional booking notes.",
            }
        )
    return rows

class HomeView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        packages_qs = (
            Package.objects.filter(status="published")
            .prefetch_related("addons", "gallery_images")
            .order_by("id")
        )
        context["packages_bootstrap"] = [
            _serialize_package_bootstrap(package)
            for package in packages_qs
        ]
        context["home_trending_packages"] = _build_mixed_home_trending_packages(
            context["packages_bootstrap"],
            limit=10,
        )
        return context


class AboutView(TemplateView):
    template_name = 'about.html'


class ServicesView(TemplateView):
    template_name = 'services.html'

class PackageDetailView(TemplateView):
    template_name = 'package-detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        package_id_or_slug = self.request.GET.get('id')
        package = None
        
        if package_id_or_slug:
            for p in Package.objects.filter(status="published").prefetch_related("addons", "gallery_images"):
                slug = p.name.lower().replace(" ", "-")
                if slugify(p.name) == package_id_or_slug or slug == package_id_or_slug or str(p.id) == package_id_or_slug:
                    package = p
                    break
        
        if package:
            package_data = _serialize_package_bootstrap(package)
            package_data["highlights"] = []
            context['package_json'] = json.dumps(package_data)
        
        return context

class PackagesView(TemplateView):
    template_name = 'packages.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        selected_filter = (self.request.GET.get("filter") or "all").strip().lower()
        search_query = (self.request.GET.get("q") or "").strip()

        packages_qs = (
            Package.objects.filter(status="published")
            .prefetch_related("addons", "gallery_images")
            .order_by("id")
        )
        packages_bootstrap = [
            _serialize_package_bootstrap(package)
            for package in packages_qs
        ]
        packages_bootstrap = [
            package_data
            for package_data in packages_bootstrap
            if _package_matches_selected_filter(package_data, selected_filter)
            and _package_matches_search_query(package_data, search_query)
        ]
        context["packages_bootstrap"] = packages_bootstrap
        context["active_filter"] = selected_filter
        context["search_query"] = search_query
        return context


class BookingView(LoginRequiredMixin, TemplateView):
    template_name = 'booking.html'
    login_url = reverse_lazy("login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        order = _get_or_create_cart_order(self.request.user)
        cart_summary = _build_cart_summary_text(order)
        initial = {
            "full_name": self.request.user.get_full_name().strip() or self.request.user.username,
            "phone": self.request.user.phone or "",
            "email": self.request.user.email or "",
            "preferred_contact": self.request.user.preferred_contact if hasattr(self.request.user, "preferred_contact") else "",
        }
        if self.request.GET.get("cart") == "1" and cart_summary:
            initial["special_requests"] = cart_summary
        context["form"] = kwargs.get("form") or BookingRequestForm(initial=initial)
        return context

    def post(self, request, *args, **kwargs):
        form = BookingRequestForm(request.POST)
        if not form.is_valid():
            messages.error(request, "Please correct the booking form fields and submit again.")
            return self.render_to_response(self.get_context_data(form=form))

        with transaction.atomic():
            booking = form.save(commit=False)
            booking.user = request.user
            booking.save()

            cart_order = _get_or_create_cart_order(request.user)
            cart_items = list(cart_order.items.prefetch_related("selected_addons__addon").select_related("package"))

            if cart_items:
                default_address = (
                    Address.objects.filter(user=request.user, is_default=True).first()
                    or Address.objects.filter(user=request.user).first()
                )
                order_total = Decimal("0.00")
                final_order = Order.objects.create(
                    user=request.user,
                    booking=booking,
                    address=default_address,
                    total_price=Decimal("0.00"),
                    status="pending",
                )
                for cart_item in cart_items:
                    final_item = OrderItem.objects.create(
                        order=final_order,
                        package=cart_item.package,
                        price=cart_item.price,
                        quantity=cart_item.quantity,
                    )
                    for selected in cart_item.selected_addons.all():
                        OrderItemAddOn.objects.create(
                            order_item=final_item,
                            addon=selected.addon,
                            price=selected.price,
                        )
                    addon_total = sum((selected.price for selected in cart_item.selected_addons.all()), Decimal("0.00"))
                    order_total += (cart_item.price + addon_total) * cart_item.quantity

                final_order.total_price = order_total
                final_order.save(update_fields=["total_price"])

            # Always remove the active cart order after successful booking submission.
            cart_order.delete()

        messages.success(request, "Booking submitted successfully. We will contact you shortly.")
        return redirect("dashboard")


class CartView(LoginRequiredMixin, TemplateView):
    template_name = 'cart.html'
    login_url = reverse_lazy("login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        payment_feedback = None
        payment_state = str(self.request.GET.get("payment") or "").strip().lower()
        session_id = str(self.request.GET.get("session_id") or "").strip()

        if payment_state == "success" and session_id:
            order, sync_error = _sync_paid_order_from_stripe_session(self.request.user, session_id)
            if order:
                payment_feedback = {
                    "tone": "success",
                    "message": "Payment confirmed successfully. Your order has been saved.",
                }
            elif sync_error:
                payment_feedback = {
                    "tone": "warning",
                    "message": "Stripe payment was completed, but the site could not confirm it yet. Refresh shortly or contact support if it still does not update.",
                }
        elif payment_state == "cancelled":
            payment_feedback = {
                "tone": "warning",
                "message": "Stripe checkout was cancelled. Your packages are still in the cart.",
            }

        order = _get_or_create_cart_order(self.request.user)
        context["cart_bootstrap"] = _serialize_cart_order(order)
        context["payment_feedback"] = payment_feedback
        return context


class BlogView(TemplateView):
    template_name = 'blog.html'

class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    template_name = 'login/signup.html'
    
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.email = self.object.email.strip().lower()
        self.object.is_active = False
        self.object.is_email_verified = False
        self.object.save()

        self.request.session["pending_verification_user_id"] = self.object.id

        try:
            _send_email_verification_code(self.object)
            messages.success(self.request, "We sent a verification code to your email address.")
        except Exception:
            messages.error(
                self.request,
                "Your account was created, but we could not send the verification code right now. Please try resending it.",
            )

        return redirect("verify_email")

    def form_invalid(self, form):
        messages.error(self.request, "Please correct the highlighted errors and try again.")
        return super().form_invalid(form)


class VerifyEmailView(TemplateView):
    template_name = "login/verify_email.html"

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and getattr(request.user, "is_email_verified", False):
            return redirect("dashboard")
        return super().dispatch(request, *args, **kwargs)

    def _get_pending_user(self):
        user_id = self.request.session.get("pending_verification_user_id")
        if user_id:
            user = User.objects.filter(id=user_id).first()
            if user and not user.is_email_verified:
                return user

        email = str(
            self.request.POST.get("email")
            or self.request.GET.get("email")
            or ""
        ).strip().lower()
        if email:
            return User.objects.filter(email__iexact=email, is_email_verified=False).first()
        return None

    def _get_form(self, user=None):
        initial_email = user.email if user else str(self.request.GET.get("email") or "").strip().lower()
        return EmailVerificationForm(initial={"email": initial_email})

    def get(self, request, *args, **kwargs):
        user = self._get_pending_user()
        if not user:
            messages.info(request, "Sign up first so we can send your verification code.")
            return redirect("signup")
        form = self._get_form(user)
        return self.render_to_response(self.get_context_data(form=form, verification_email=user.email))

    def post(self, request, *args, **kwargs):
        user = self._get_pending_user()
        if not user:
            messages.info(request, "Sign up first so we can send your verification code.")
            return redirect("signup")

        if request.POST.get("action") == "resend":
            try:
                _send_email_verification_code(user)
                messages.success(request, "A new verification code has been sent.")
            except Exception:
                messages.error(request, "We could not resend the verification code right now. Please try again.")
            return redirect(f"{reverse('verify_email')}?email={user.email}")

        form = EmailVerificationForm(request.POST)
        if not form.is_valid():
            return self.render_to_response(self.get_context_data(form=form, verification_email=user.email))

        submitted_email = form.cleaned_data["email"].strip().lower()
        submitted_code = form.cleaned_data["code"]
        if submitted_email != user.email.lower():
            form.add_error("email", "Please use the same email address you signed up with.")
            return self.render_to_response(self.get_context_data(form=form, verification_email=user.email))

        if not _email_verification_code_is_valid(user, submitted_code):
            form.add_error("code", "That verification code is invalid or has expired.")
            return self.render_to_response(self.get_context_data(form=form, verification_email=user.email))

        user.is_active = True
        user.is_email_verified = True
        user.email_verification_code = ""
        user.email_verification_sent_at = None
        user.save(
            update_fields=[
                "is_active",
                "is_email_verified",
                "email_verification_code",
                "email_verification_sent_at",
            ]
        )

        self.request.session.pop("pending_verification_user_id", None)
        login(request, user)
        messages.success(request, "Your email has been verified. Welcome to BettyVerse.")
        return redirect("dashboard")

class CustomLoginView(LoginView):
    template_name = 'login/login_index.html'
    form_class = EmailAuthenticationForm
    redirect_authenticated_user = True

    def form_invalid(self, form):
        attempted_email = str(self.request.POST.get("username") or "").strip().lower()
        pending_user = User.objects.filter(email__iexact=attempted_email, is_email_verified=False).first()
        if pending_user:
            self.request.session["pending_verification_user_id"] = pending_user.id
            messages.info(self.request, "Please verify your email address before logging in.")
            return redirect(f"{reverse('verify_email')}?email={pending_user.email}")
        messages.error(self.request, "Invalid email or password.")
        return super().form_invalid(form)


class BettyVersePasswordResetView(PasswordResetView):
    form_class = BettyVersePasswordResetForm
    html_email_template_name = "login/password_reset_email.html"

    def form_valid(self, form):
        public_base_url = str(getattr(settings, "PASSWORD_RESET_BASE_URL", "") or "").strip()
        domain_override = None
        use_https = self.request.is_secure()

        if public_base_url:
            parsed = urlsplit(public_base_url)
            if parsed.netloc:
                domain_override = parsed.netloc
                use_https = parsed.scheme == "https"

        form.save(
            use_https=use_https,
            token_generator=self.token_generator,
            from_email=settings.EMAIL_HOST_USER,
            email_template_name=self.email_template_name,
            subject_template_name=self.subject_template_name,
            request=self.request,
            html_email_template_name=self.html_email_template_name,
            extra_email_context=self.extra_email_context,
            domain_override=domain_override,
        )
        return redirect(self.get_success_url())


class StaffRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    login_url = reverse_lazy("login")

    def test_func(self):
        return bool(self.request.user.is_staff)

    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            messages.error(self.request, "You do not have permission to access that page.")
            return redirect("home")
        return super().handle_no_permission()


class NewsletterSubscribeView(View):
    def post(self, request, *args, **kwargs):
        form = NewsletterSubscriptionForm(request.POST)
        redirect_target = _get_safe_next_url(request)

        if not form.is_valid():
            messages.error(request, "Please enter a valid email address for the newsletter.")
            return redirect(redirect_target)

        email = form.cleaned_data["email"]
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                "user": request.user if request.user.is_authenticated else None,
                "is_active": True,
            },
        )

        updates = []
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            updates.append("is_active")
        if request.user.is_authenticated and subscriber.user_id is None:
            subscriber.user = request.user
            updates.append("user")
        if updates:
            subscriber.save(update_fields=updates)

        status = "already-subscribed"
        if created or updates:
            try:
                _send_newsletter_welcome_email(subscriber)
            except Exception:
                messages.error(request, "You were subscribed, but we could not send the welcome email right now.")
            status = "subscribed"

        query = urlencode(
            {
                "email": subscriber.email,
                "status": status,
                "return_to": redirect_target,
            }
        )
        return redirect(f"{reverse('newsletter_subscribe_success')}?{query}")


class NewsletterSubscribeSuccessView(TemplateView):
    template_name = "newsletter/success.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        email = str(self.request.GET.get("email") or "").strip().lower()
        status = str(self.request.GET.get("status") or "subscribed").strip().lower()
        return_to = _get_safe_next_url(self.request, fallback_name="home")
        context["subscriber_email"] = email
        context["subscription_status"] = status
        context["return_to"] = return_to
        return context


class NewsletterAdminView(StaffRequiredMixin, TemplateView):
    template_name = "admin-panel/newsletters.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["subscribers"] = NewsletterSubscriber.objects.order_by("-created_at")
        context["campaigns"] = NewsletterCampaign.objects.select_related("sent_by").order_by("-created_at")[:20]
        context["form"] = kwargs.get("form") or NewsletterCampaignForm()
        context["active_subscriber_count"] = NewsletterSubscriber.objects.filter(is_active=True).count()
        return context

    def post(self, request, *args, **kwargs):
        form = NewsletterCampaignForm(request.POST)
        subscribers = list(NewsletterSubscriber.objects.filter(is_active=True).order_by("email"))

        if not subscribers:
            messages.error(request, "There are no active newsletter subscribers to send to yet.")
            return self.render_to_response(self.get_context_data(form=form))

        if not form.is_valid():
            messages.error(request, "Please complete the newsletter subject and message.")
            return self.render_to_response(self.get_context_data(form=form))

        campaign = form.save(commit=False)
        campaign.sent_by = request.user
        campaign.save()

        try:
            sent_count = _send_newsletter_campaign(campaign, subscribers)
        except Exception as exc:
            campaign.delete()
            messages.error(request, f"Unable to send newsletter emails right now: {exc}")
            return self.render_to_response(self.get_context_data(form=form))

        messages.success(request, f"Newsletter sent successfully to {sent_count} subscriber(s).")
        return redirect("newsletter_admin")


class NewsletterSubscriberToggleView(StaffRequiredMixin, View):
    def post(self, request, subscriber_id, *args, **kwargs):
        subscriber = get_object_or_404(NewsletterSubscriber, id=subscriber_id)
        subscriber.is_active = not subscriber.is_active
        subscriber.save(update_fields=["is_active", "updated_at"])
        state = "active" if subscriber.is_active else "inactive"
        messages.success(request, f"{subscriber.email} is now marked as {state}.")
        return redirect("newsletter_admin")


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'user-dashboard.html'
    login_url = reverse_lazy('login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["dashboard_bootstrap"] = _serialize_dashboard_profile(self.request.user)
        return context


class AdminPanelView(LoginRequiredMixin, TemplateView):
    template_name = 'admin-panel/index.html'
    login_url = reverse_lazy('login')


class CartDataView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        order = _get_or_create_cart_order(request.user)
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartAddItemView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        package_id = payload.get("package_id")
        package_slug = str(payload.get("package_slug") or "").strip()
        package_name = str(payload.get("package_name") or "").strip()
        package_category = str(payload.get("package_category") or "").strip()
        package_price = _to_decimal(payload.get("package_price"), "0.00")
        package_summary = str(payload.get("package_summary") or "").strip()
        package_image = str(payload.get("package_image") or "").strip()
        package_tags = str(payload.get("package_tags") or "").strip()
        addon_ids = payload.get("addon_ids") or []
        addon_names = payload.get("addon_names") or []
        addon_rows = payload.get("addon_rows") or []

        package = None
        published_qs = Package.objects.filter(status="published")

        if package_id:
            package = published_qs.filter(pk=package_id).first()

        if not package and package_name:
            by_name = published_qs.filter(name__iexact=package_name)
            if package_category:
                by_name = by_name.filter(category__iexact=package_category)
            package = by_name.order_by("-updated_at").first()

        if not package and package_slug:
            normalized_target = slugify(package_slug)
            for candidate in published_qs.only("id", "name"):
                if slugify(candidate.name) == normalized_target:
                    package = candidate
                    break

        if not package:
            if not package_name:
                return JsonResponse({"ok": False, "error": "Package not found."}, status=404)
            package, _ = Package.objects.get_or_create(
                name=package_name,
                category=package_category or "Package",
                defaults={
                    "base_price": package_price,
                    "summary": package_summary or package_name,
                    "image_url": package_image,
                    "status": "published",
                    "tags": package_tags,
                },
            )

        selected_addons = []
        if addon_ids:
            selected_addons.extend(AddOn.objects.filter(package=package, id__in=addon_ids))
        if addon_names:
            normalized_names = [str(name).strip() for name in addon_names if str(name).strip()]
            if normalized_names:
                name_q = Q()
                for name in normalized_names:
                    name_q |= Q(name__iexact=name)
                selected_addons.extend(AddOn.objects.filter(package=package).filter(name_q))
        if addon_rows:
            for row in addon_rows:
                name = str((row or {}).get("name") or "").strip()
                if not name:
                    continue
                price = _to_decimal((row or {}).get("price"), "0.00")
                addon = AddOn.objects.filter(package=package, name__iexact=name).first()
                if not addon:
                    addon = AddOn.objects.create(package=package, name=name, price=price)
                selected_addons.append(addon)
        # Remove duplicates while preserving queryset instances.
        selected_addons = list({addon.id: addon for addon in selected_addons}.values())

        order = _get_or_create_cart_order(request.user)
        item = order.items.filter(package=package).first()
        if not item:
            item = OrderItem.objects.create(
                order=order,
                package=package,
                price=package.base_price,
                quantity=1,
            )
        else:
            item.price = package.base_price
            item.quantity = 1
            item.save(update_fields=["price", "quantity"])

        item.selected_addons.all().delete()
        for addon in selected_addons:
            OrderItemAddOn.objects.create(order_item=item, addon=addon, price=addon.price)

        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartRemoveItemView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        item_id = payload.get("item_id")
        if not item_id:
            return JsonResponse({"ok": False, "error": "item_id is required."}, status=400)

        order = _get_or_create_cart_order(request.user)
        order.items.filter(id=item_id).delete()
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartClearView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        order = _get_or_create_cart_order(request.user)
        order.items.all().delete()
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class DashboardDataView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        user = request.user
        addresses = Address.objects.filter(user=user).order_by("-is_default", "-id")
        return JsonResponse(
            {
                "ok": True,
                "profile": _serialize_dashboard_profile(user),
                "orders": _serialize_dashboard_orders(user),
                "bookings": _serialize_dashboard_bookings(user),
                "addresses": [_serialize_address(address) for address in addresses],
            }
        )


class DashboardProfileUpdateView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        user = request.user

        name = str(payload.get("name") or "").strip()
        if name:
            parts = name.split()
            user.first_name = parts[0]
            user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        user.email = str(payload.get("email") or user.email or "").strip().lower()
        user.phone = str(payload.get("phone") or "").strip()
        user.preferred_contact = str(payload.get("preferredContact") or "email").strip() or "email"
        user.event_preferences = str(payload.get("eventPreferences") or "").strip()
        user.notes = str(payload.get("notes") or "").strip()

        birthday_value = str(payload.get("birthday") or "").strip()
        if birthday_value:
            user.birthday = birthday_value
        else:
            user.birthday = None

        user.save()
        profile = _serialize_dashboard_profile(user)
        if payload.get("avatar"):
            profile["avatar"] = payload.get("avatar")
        return JsonResponse({"ok": True, "profile": profile})


class DashboardAddressSaveView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        user = request.user
        address_id = payload.get("id")

        if address_id:
            address = get_object_or_404(Address, id=address_id, user=user)
        else:
            address = Address(user=user)

        address.label = str(payload.get("label") or "").strip() or "Home"
        address.recipient = str(payload.get("recipient") or user.get_full_name() or user.username).strip()
        address.phone = str(payload.get("phone") or user.phone or "").strip()
        address.line1 = str(payload.get("line1") or "").strip()
        address.line2 = str(payload.get("line2") or "").strip()
        address.city = str(payload.get("city") or "").strip()
        address.region = str(payload.get("region") or "").strip()
        address.postcode = str(payload.get("postcode") or "").strip()
        address.country = str(payload.get("country") or "").strip()
        address.is_default = bool(payload.get("isDefault"))

        required_fields = [address.line1, address.city, address.region, address.postcode, address.country]
        if not all(required_fields):
            return JsonResponse({"ok": False, "error": "Please complete all required address fields."}, status=400)

        with transaction.atomic():
            if address.is_default:
                Address.objects.filter(user=user, is_default=True).update(is_default=False)
            address.save()

        return JsonResponse({"ok": True, "address": _serialize_address(address)})


class DashboardPasswordChangeView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        current_password = str(payload.get("currentPassword") or "")
        new_password = str(payload.get("newPassword") or "")

        if not request.user.check_password(current_password):
            return JsonResponse({"ok": False, "error": "Current password is incorrect."}, status=400)
        if len(new_password) < 8:
            return JsonResponse({"ok": False, "error": "New password must be at least 8 characters."}, status=400)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request, request.user)
        return JsonResponse({"ok": True})


class CheckoutAddressView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).first()
        )
        if not address:
            return JsonResponse(
                {
                    "ok": True,
                    "address": {
                        "label": "",
                        "line1": "",
                        "line2": "",
                        "city": "",
                        "postcode": "",
                        "country": "",
                    },
                }
            )
        return JsonResponse(
            {
                "ok": True,
                "address": {
                    "label": address.label,
                    "line1": address.line1,
                    "line2": address.line2 or "",
                    "city": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                },
            }
        )

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        label = str(payload.get("label") or "").strip() or "Delivery address"
        line1 = str(payload.get("line1") or "").strip()
        city = str(payload.get("city") or "").strip()
        postcode = str(payload.get("postcode") or "").strip()
        country = str(payload.get("country") or "").strip()
        line2 = str(payload.get("line2") or "").strip()

        if not line1 or not city or not postcode or not country:
            return JsonResponse({"ok": False, "error": "Please complete all required address fields."}, status=400)

        with transaction.atomic():
            Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
            address = Address.objects.create(
                user=request.user,
                label=label,
                recipient=request.user.get_full_name().strip() or request.user.username,
                phone=request.user.phone or "",
                line1=line1,
                line2=line2,
                city=city,
                region=city,
                postcode=postcode,
                country=country,
                is_default=True,
            )
        return JsonResponse(
            {
                "ok": True,
                "address": {
                    "label": address.label,
                    "line1": address.line1,
                    "line2": address.line2 or "",
                    "city": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                },
            }
        )


class CheckoutPayView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        method = str(payload.get("method") or "card").strip().lower()
        if method not in {"card", "paypal", "apple", "google"}:
            return JsonResponse({"ok": False, "error": "Invalid payment method."}, status=400)

        order = _get_or_create_cart_order(request.user)
        if not order.items.exists():
            return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)

        address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).first()
        )
        order.address = address
        order.status = "paid"
        order.save(update_fields=["address", "status"])

        return JsonResponse(
            {
                "ok": True,
                "order_id": order.id,
                "message": f"{method.title()} payment confirmed successfully.",
            }
        )


class CheckoutStripeSessionView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        stripe_sdk = _get_stripe_sdk()
        if stripe_sdk is None:
            return JsonResponse(
                {
                    "ok": False,
                    "error": "Stripe SDK is not installed in the active Python environment. Run: python3 -m pip install --user --break-system-packages stripe",
                },
                status=500,
            )
        if not settings.STRIPE_SECRET_KEY:
            return JsonResponse(
                {"ok": False, "error": "Stripe secret key is missing in server settings."},
                status=500,
            )

        order = _get_or_create_cart_order(request.user)
        cart = _serialize_cart_order(order)
        if not cart["items"]:
            return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)

        address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).first()
        )
        if address and order.address_id != address.id:
            order.address = address
            order.save(update_fields=["address"])

        stripe_sdk.api_key = settings.STRIPE_SECRET_KEY
        success_url = request.build_absolute_uri(reverse("cart")) + "?payment=success&session_id={CHECKOUT_SESSION_ID}"
        cancel_url = request.build_absolute_uri(reverse("cart")) + "?payment=cancelled"

        line_items = []
        for item in cart["items"]:
            unit_amount = int(round(Decimal(str(item["price"])) * Decimal("100")))
            if unit_amount <= 0:
                continue
            line_items.append(
                {
                    "price_data": {
                        "currency": settings.STRIPE_CURRENCY,
                        "product_data": {
                            "name": item["name"] or "Package",
                            "description": item["summary"] or item["category"] or "BettyVerse package",
                        },
                        "unit_amount": unit_amount,
                    },
                    "quantity": int(item.get("quantity") or 1),
                }
            )
        if not line_items:
            return JsonResponse({"ok": False, "error": "No payable items in cart."}, status=400)

        try:
            session = stripe_sdk.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=line_items,
                metadata={
                    "order_id": str(order.id),
                    "user_id": str(request.user.id),
                },
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(order.id),
            )
        except Exception as exc:
            return JsonResponse({"ok": False, "error": f"Unable to start Stripe checkout: {exc}"}, status=400)

        return JsonResponse({"ok": True, "checkout_url": session.url, "session_id": session.id})


@method_decorator(csrf_exempt, name="dispatch")
class CheckoutStripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        stripe_sdk = _get_stripe_sdk()
        if stripe_sdk is None or not settings.STRIPE_SECRET_KEY:
            return HttpResponse(status=400)

        stripe_sdk.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            if settings.STRIPE_WEBHOOK_SECRET:
                event = stripe_sdk.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
            else:
                event = json.loads(payload.decode("utf-8") or "{}")
        except Exception:
            return HttpResponse(status=400)

        event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", "")
        event_data = event.get("data", {}) if isinstance(event, dict) else getattr(event, "data", {})
        obj = event_data.get("object", {}) if isinstance(event_data, dict) else getattr(event_data, "object", {})

        if event_type == "checkout.session.completed":
            metadata = _stripe_value(obj, "metadata", {}) or {}
            order_id = metadata.get("order_id") or _stripe_value(obj, "client_reference_id")
            payment_status = _stripe_value(obj, "payment_status")
            if order_id and payment_status == "paid":
                order = Order.objects.filter(id=order_id).first()
                _mark_order_paid(order)

        return HttpResponse(status=200)
