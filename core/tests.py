import json
import shutil
import tempfile
from unittest.mock import Mock, patch

from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone

from .models import Address, Booking, NewsletterCampaign, NewsletterSubscriber, Order, OrderItem, Package, PackageImage, User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailVerificationFlowTests(TestCase):
    def test_signup_creates_inactive_user_and_sends_verification_code(self):
        response = self.client.post(
            reverse("signup"),
            {
                "username": "newclient",
                "email": "newclient@example.com",
                "password1": "StrongPass123!",
                "password2": "StrongPass123!",
                "phone": "1234567890",
            },
        )

        user = User.objects.get(email="newclient@example.com")

        self.assertRedirects(response, reverse("verify_email"))
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_email_verified)
        self.assertEqual(len(user.email_verification_code), 6)
        self.assertEqual(self.client.session.get("pending_verification_user_id"), user.id)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(user.email_verification_code, mail.outbox[0].body)

    def test_verification_code_activates_user_and_logs_them_in(self):
        user = User.objects.create(
            username="verifyme",
            email="verifyme@example.com",
            is_active=False,
            is_email_verified=False,
            email_verification_code="123456",
            email_verification_sent_at=timezone.now(),
        )
        user.set_password("StrongPass123!")
        user.save()

        session = self.client.session
        session["pending_verification_user_id"] = user.id
        session.save()

        response = self.client.post(
            reverse("verify_email"),
            {
                "email": user.email,
                "code": "123456",
            },
        )

        user.refresh_from_db()

        self.assertRedirects(response, reverse("dashboard"))
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_email_verified)
        self.assertEqual(user.email_verification_code, "")
        self.assertEqual(str(self.client.session.get("_auth_user_id")), str(user.id))

    def test_login_redirects_unverified_user_to_verification_page(self):
        user = User.objects.create(
            username="pendinguser",
            email="pending@example.com",
            is_active=False,
            is_email_verified=False,
            email_verification_code="654321",
            email_verification_sent_at=timezone.now(),
        )
        user.set_password("StrongPass123!")
        user.save()

        response = self.client.post(
            reverse("login"),
            {
                "username": user.email,
                "password": "StrongPass123!",
            },
        )

        self.assertRedirects(response, f"{reverse('verify_email')}?email={user.email}")
        self.assertEqual(self.client.session.get("pending_verification_user_id"), user.id)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class NewsletterFlowTests(TestCase):
    def test_footer_subscription_creates_subscriber(self):
        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=subscribed&return_to=%2F",
        )
        self.assertTrue(
            NewsletterSubscriber.objects.filter(email="subscriber@example.com", is_active=True).exists()
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["subscriber@example.com"])
        self.assertIn("Welcome to the BettyVerse newsletter", mail.outbox[0].subject)

    def test_footer_subscription_reactivates_existing_subscriber(self):
        NewsletterSubscriber.objects.create(email="subscriber@example.com", is_active=False)

        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        subscriber = NewsletterSubscriber.objects.get(email="subscriber@example.com")
        self.assertTrue(subscriber.is_active)
        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=subscribed&return_to=%2F",
        )
        self.assertEqual(len(mail.outbox), 1)

    def test_footer_subscription_redirects_already_subscribed_user_to_confirmation_page(self):
        NewsletterSubscriber.objects.create(email="subscriber@example.com", is_active=True)

        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=already-subscribed&return_to=%2F",
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_staff_can_send_newsletter_to_active_subscribers_only(self):
        staff_user = User.objects.create_user(
            username="staffuser",
            email="staff@example.com",
            password="StrongPass123!",
            is_staff=True,
            is_active=True,
            is_email_verified=True,
        )
        NewsletterSubscriber.objects.create(email="active1@example.com", is_active=True)
        NewsletterSubscriber.objects.create(email="active2@example.com", is_active=True)
        NewsletterSubscriber.objects.create(email="inactive@example.com", is_active=False)

        self.client.force_login(staff_user)
        response = self.client.post(
            reverse("newsletter_admin"),
            {
                "subject": "New Offers",
                "body": "This is our latest newsletter.",
            },
        )

        self.assertRedirects(response, reverse("newsletter_admin"))
        campaign = NewsletterCampaign.objects.get(subject="New Offers")
        self.assertEqual(campaign.recipient_count, 2)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(sorted(message.to[0] for message in mail.outbox), ["active1@example.com", "active2@example.com"])


class PackageGalleryTests(TestCase):
    def test_package_detail_exposes_gallery_images_in_order(self):
        package = Package.objects.create(
            name="Betty And Confetti - Neon Luxe Arch",
            category="Birthday",
            base_price="200.00",
            summary="Luxury balloon arch with neon styling.",
            image_url="images/bandc25s.jpg",
            status="published",
        )
        PackageImage.objects.create(
            package=package,
            image_url="images/added_bday.jpeg",
            alt_text="Alternate setup angle",
            sort_order=1,
        )
        PackageImage.objects.create(
            package=package,
            image_url="images/bandc25.jpeg",
            alt_text="Close-up detail shot",
            sort_order=2,
        )

        response = self.client.get(reverse("package_detail"), {"id": "betty-and-confetti-neon-luxe-arch"})

        self.assertEqual(response.status_code, 200)
        package_data = json.loads(response.context["package_json"])
        self.assertEqual(package_data["image"], "/static/images/bandc25s.jpg")
        self.assertEqual(
            package_data["images"],
            [
                "/static/images/bandc25s.jpg",
                "/static/images/added_bday.jpeg",
                "/static/images/bandc25.jpeg",
            ],
        )

    def test_package_detail_falls_back_to_primary_image_when_no_gallery_exists(self):
        package = Package.objects.create(
            name="Finding Nemo Inspired Package",
            category="Birthday",
            base_price="110.00",
            summary="An underwater setup.",
            image_url="images/Nemo_inspired.jpg",
            status="published",
        )

        response = self.client.get(reverse("package_detail"), {"id": str(package.id)})

        self.assertEqual(response.status_code, 200)
        package_data = json.loads(response.context["package_json"])
        self.assertEqual(package_data["images"], ["/static/images/Nemo_inspired.jpg"])

    def test_relative_static_image_paths_are_valid_for_package_models(self):
        package = Package.objects.create(
            name="Static Image Package",
            category="Birthday",
            base_price="120.00",
            summary="Uses a static frontend image path.",
            image_url="images/static-demo.jpg",
            status="published",
        )
        package.full_clean()

        gallery_image = PackageImage(
            package=package,
            image_url="images/static-detail.jpg",
            alt_text="Static gallery image",
            sort_order=1,
        )
        gallery_image.full_clean()

    def test_uploaded_gallery_image_is_added_without_replacing_primary_image(self):
        media_root = tempfile.mkdtemp()
        self.addCleanup(lambda: shutil.rmtree(media_root, ignore_errors=True))

        with override_settings(MEDIA_ROOT=media_root):
            package = Package.objects.create(
                name="Uploaded Gallery Package",
                category="Birthday",
                base_price="150.00",
                summary="Primary static image plus uploaded gallery image.",
                image_url="images/Nemo_inspired.jpg",
                status="published",
            )
            PackageImage.objects.create(
                package=package,
                image=SimpleUploadedFile("extra.jpg", b"gallery-image-bytes", content_type="image/jpeg"),
                alt_text="Uploaded gallery image",
                sort_order=1,
            )

            response = self.client.get(reverse("package_detail"), {"id": "uploaded-gallery-package"})

        self.assertEqual(response.status_code, 200)
        package_data = json.loads(response.context["package_json"])
        self.assertEqual(package_data["images"][0], "/static/images/Nemo_inspired.jpg")
        self.assertEqual(len(package_data["images"]), 2)
        self.assertTrue(package_data["images"][1].endswith("/media/packages/gallery/extra.jpg"))

    def test_packages_view_bootstrap_uses_backend_slugs_and_gallery_images(self):
        package = Package.objects.create(
            name="Mickey Mouse Themed",
            category="Birthday",
            base_price="170.00",
            summary="Backend-driven package card data.",
            image_url="images/Mickey_Themed.jpeg",
            status="published",
            tags="kids-birthday",
        )
        PackageImage.objects.create(
            package=package,
            image_url="images/Mickey_detail.jpeg",
            alt_text="Detail shot",
            sort_order=1,
        )

        response = self.client.get(reverse("packages"))

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["slug"], "mickey-mouse-themed")
        self.assertEqual(bootstrap[0]["id"], "mickey-mouse-themed")
        self.assertEqual(bootstrap[0]["packageId"], package.id)
        self.assertEqual(
            bootstrap[0]["images"],
            ["/static/images/Mickey_Themed.jpeg", "/static/images/Mickey_detail.jpeg"],
        )

    def test_home_view_bootstrap_is_available_for_frontend_hydration(self):
        package = Package.objects.create(
            name="The Luxe Boot Reveal",
            category="Birthday",
            base_price="180.00",
            summary="Hydrates legacy frontend cards from backend data.",
            image_url="images/car_boot4.jpg",
            status="published",
            tags="car-boot",
        )

        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["packageId"], package.id)
        self.assertEqual(bootstrap[0]["slug"], "the-luxe-boot-reveal")

    def test_packages_bootstrap_does_not_include_frontend_only_orphan_cards(self):
        Package.objects.create(
            name="Betty And Confetti - Sweet 16 Pillar Setup",
            category="Birthday",
            base_price="120.00",
            summary="A real backend package.",
            image_url="images/bandc16.png",
            status="published",
        )

        response = self.client.get(reverse("packages"))

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        slugs = [item["slug"] for item in bootstrap]
        names = [item["name"] for item in bootstrap]
        self.assertNotIn("safari-luxe-experience", slugs)
        self.assertNotIn('The "Heartfelt Apology" Room Transformation', names)

    def test_packages_view_bootstrap_supports_renamed_package_with_same_image(self):
        package = Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Renamed package that should still match the existing frontend card image.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )

        response = self.client.get(reverse("packages"))

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["name"], "Luxury Christmas Tree")
        self.assertEqual(bootstrap[0]["slug"], "luxury-christmas-tree")
        self.assertEqual(bootstrap[0]["packageId"], package.id)
        self.assertEqual(bootstrap[0]["image"], "/static/images/festive6.jpeg")

    def test_packages_view_filters_results_by_search_query(self):
        Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Christmas styling with premium ornaments.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )
        Package.objects.create(
            name="Finding Nemo Inspired Package",
            category="Birthday",
            base_price="110.00",
            summary="An underwater birthday setup.",
            image_url="images/Nemo_inspired.jpg",
            status="published",
            tags="kids-birthday",
        )

        response = self.client.get(reverse("packages"), {"q": "christmas"})

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(response.context["search_query"], "christmas")
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["name"], "Luxury Christmas Tree")

    def test_packages_view_combines_filter_and_search_query(self):
        Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Christmas styling with premium ornaments.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )
        Package.objects.create(
            name="Christmas Birthday Surprise",
            category="Birthday",
            base_price="150.00",
            summary="Birthday setup with festive accents.",
            image_url="images/birthday_demo.jpg",
            status="published",
            tags="christmas,birthday",
        )

        response = self.client.get(reverse("packages"), {"filter": "festival", "q": "christmas"})

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(response.context["active_filter"], "festival")
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["name"], "Luxury Christmas Tree")

    def test_legacy_nested_packages_html_route_still_renders_filtered_results(self):
        Package.objects.create(
            name="Baby Shower Luxe",
            category="Surprise",
            base_price="160.00",
            summary="Baby shower setup.",
            image_url="images/baby_shower2.jpg",
            status="published",
            tags="baby-shower",
        )

        response = self.client.get("/packages/packages.html", {"filter": "surprise", "q": "baby shower"})

        self.assertEqual(response.status_code, 200)
        bootstrap = response.context["packages_bootstrap"]
        self.assertEqual(len(bootstrap), 1)
        self.assertEqual(bootstrap[0]["name"], "Baby Shower Luxe")

    def test_packages_page_renders_package_cards_directly_from_backend_data(self):
        Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Rendered directly from Django.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )

        response = self.client.get(reverse("packages"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Luxury Christmas Tree")
        self.assertNotContains(response, "Christmas Decorations Dummy Package 1")
        self.assertNotContains(response, "Safari Luxe Experience")

    def test_home_page_trending_renders_directly_from_backend_data(self):
        Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Rendered directly from Django on home trending.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )

        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Luxury Christmas Tree")
        self.assertNotContains(response, "Christmas Decorations Dummy Package 1")

    def test_home_page_trending_mixes_multiple_package_categories(self):
        Package.objects.create(
            name="Birthday One",
            category="Birthday",
            base_price="100.00",
            summary="Birthday package one.",
            image_url="images/birthday_demo.jpg",
            status="published",
        )
        Package.objects.create(
            name="Birthday Two",
            category="Birthday",
            base_price="110.00",
            summary="Birthday package two.",
            image_url="images/bday_demo.png",
            status="published",
        )
        Package.objects.create(
            name="Anniversary Glow",
            category="Anniversary",
            base_price="140.00",
            summary="Anniversary package.",
            image_url="images/anniversary_demo.jpeg",
            status="published",
        )
        Package.objects.create(
            name="Festival Magic",
            category="Festival",
            base_price="150.00",
            summary="Festival package.",
            image_url="images/christmas_demo.jpeg",
            status="published",
        )
        Package.objects.create(
            name="Proposal Luxe",
            category="Surprise",
            base_price="160.00",
            summary="Surprise package.",
            image_url="images/propose_1.jpg",
            status="published",
        )

        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        trending = response.context["home_trending_packages"]
        self.assertEqual(
            [item["name"] for item in trending[:4]],
            ["Birthday One", "Anniversary Glow", "Festival Magic", "Proposal Luxe"],
        )
        self.assertEqual(
            [_normalize for _normalize in [item["filterCategory"] for item in trending[:4]]],
            ["birthday", "anniversary", "festival", "surprise"],
        )


class StripeCheckoutFlowTests(TestCase):
    def test_cart_success_redirect_marks_order_paid_and_clears_active_cart(self):
        user = User.objects.create_user(
            username="stripeuser",
            email="stripe@example.com",
            password="StrongPass123!",
            is_active=True,
            is_email_verified=True,
        )
        package = Package.objects.create(
            name="Luxury Christmas Tree",
            category="Festival",
            base_price="180.00",
            summary="Stripe checkout package.",
            image_url="images/festive6.jpeg",
            status="published",
            tags="christmas",
        )
        order = Order.objects.create(user=user, total_price="180.00", status="pending")
        OrderItem.objects.create(order=order, package=package, price="180.00", quantity=1)
        self.client.force_login(user)

        stripe_sdk = Mock()
        stripe_sdk.checkout.Session.retrieve.return_value = {
            "payment_status": "paid",
            "metadata": {
                "order_id": str(order.id),
                "user_id": str(user.id),
            },
            "client_reference_id": str(order.id),
        }

        with patch("core.views._get_stripe_sdk", return_value=stripe_sdk):
            response = self.client.get(
                reverse("cart"),
                {"payment": "success", "session_id": "cs_test_paid"},
            )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, "paid")
        self.assertEqual(response.context["cart_bootstrap"]["items_count"], 0)
        self.assertEqual(response.context["payment_feedback"]["tone"], "success")
        self.assertEqual(
            response.context["payment_feedback"]["message"],
            "Payment confirmed successfully. Your order has been saved.",
        )


class BookingFlowTests(TestCase):
    def test_checkout_address_get_returns_empty_state_when_user_has_no_saved_address(self):
        user = User.objects.create_user(
            username="checkoutuser",
            email="checkout@example.com",
            password="StrongPass123!",
            is_active=True,
            is_email_verified=True,
        )
        self.client.force_login(user)

        response = self.client.get(reverse("checkout_address"))

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            response.content,
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
            },
        )

    def test_checkout_address_post_uses_neutral_label_when_user_leaves_it_blank(self):
        user = User.objects.create_user(
            username="addressuser",
            email="address@example.com",
            password="StrongPass123!",
            is_active=True,
            is_email_verified=True,
        )
        self.client.force_login(user)

        response = self.client.post(
            reverse("checkout_address"),
            data=json.dumps(
                {
                    "label": "",
                    "line1": "12 Event Street",
                    "line2": "",
                    "city": "London",
                    "postcode": "SW1A 1AA",
                    "country": "United Kingdom",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Address.objects.filter(user=user, label="Delivery address", is_default=True).exists())
        payload = json.loads(response.content)
        self.assertEqual(payload["address"]["label"], "Delivery address")

    def test_booking_submission_accepts_acknowledgement_checkboxes(self):
        user = User.objects.create_user(
            username="bookinguser",
            email="booking@example.com",
            password="StrongPass123!",
            is_active=True,
            is_email_verified=True,
        )
        self.client.force_login(user)

        response = self.client.post(
            reverse("booking"),
            {
                "full_name": "Booking User",
                "phone": "1234567890",
                "email": "booking@example.com",
                "event_type": "Birthday",
                "event_datetime": "2026-06-15T18:30",
                "theme": "Blue",
                "occasion_details": "Surprise setup",
                "special_requests": "Balloon styling",
                "property_type": "home",
                "parking_availability": "yes",
                "access_instructions": "Use the side gate",
                "budget": "250",
                "photo_video_permission": "yes",
                "inspiration_links": "",
                "travel_fees_ack": "on",
                "deposit_required_ack": "on",
            },
        )

        self.assertRedirects(response, reverse("dashboard"))
        self.assertTrue(Booking.objects.filter(user=user, event_type="Birthday").exists())


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetFlowTests(TestCase):
    def test_password_reset_request_sends_email(self):
        user = User.objects.create_user(
            username="resetuser",
            email="reset@example.com",
            password="OldPass123!",
            is_active=True,
            is_email_verified=True,
        )

        response = self.client.post(reverse("password_reset"), {"email": user.email})

        self.assertRedirects(response, reverse("password_reset_done"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("BettyVerse password reset", mail.outbox[0].subject)
        self.assertIn(user.email, mail.outbox[0].body)

    def test_password_reset_confirm_updates_password(self):
        user = User.objects.create_user(
            username="confirmuser",
            email="confirm@example.com",
            password="OldPass123!",
            is_active=True,
            is_email_verified=True,
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        confirm_url = reverse("password_reset_confirm", kwargs={"uidb64": uid, "token": token})

        response = self.client.get(confirm_url)
        self.assertEqual(response.status_code, 302)

        response = self.client.post(
            response.url,
            {
                "new_password1": "NewSecurePass123!",
                "new_password2": "NewSecurePass123!",
            },
        )

        user.refresh_from_db()
        self.assertRedirects(response, reverse("password_reset_complete"))
        self.assertTrue(user.check_password("NewSecurePass123!"))

    def test_dashboard_password_change_endpoint_updates_password(self):
        user = User.objects.create_user(
            username="dashreset",
            email="dashreset@example.com",
            password="OldPass123!",
            is_active=True,
            is_email_verified=True,
        )
        self.client.force_login(user)

        response = self.client.post(
            reverse("dashboard_password_change"),
            data=json.dumps(
                {
                    "currentPassword": "OldPass123!",
                    "newPassword": "NewSecurePass123!",
                }
            ),
            content_type="application/json",
        )

        user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.check_password("NewSecurePass123!"))
