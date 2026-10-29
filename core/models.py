from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_code = models.CharField(max_length=6, blank=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    preferred_contact = models.CharField(
        max_length=10,
        choices=[('email', 'Email'), ('phone', 'Phone'), ('whatsapp', 'WhatsApp')],
        default='email'
    )
    birthday = models.DateField(blank=True, null=True)
    event_preferences = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tier = models.CharField(max_length=50, default='Standard')

    def __str__(self):
        return self.username


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='newsletter_subscriptions')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email


class NewsletterCampaign(models.Model):
    subject = models.CharField(max_length=255)
    body = models.TextField()
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_newsletter_campaigns')
    recipient_count = models.PositiveIntegerField(default=0)
    sent_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.subject

class Package(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    summary = models.TextField()
    image = models.ImageField(upload_to='packages/', blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True) # for existing static images or direct URLs
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    tags = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PackageImage(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='packages/gallery/', blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('sort_order', 'id')

    def __str__(self):
        label = self.alt_text or self.package.name
        return f"{self.package.name} image: {label}"


class AddOn(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} (+£{self.price})"

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50, help_text="e.g. Home, Office")
    recipient = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    postcode = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label} - {self.user.username}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    event_type = models.CharField(max_length=100)
    event_datetime = models.DateTimeField()
    theme = models.CharField(max_length=100, blank=True, null=True)
    occasion_details = models.CharField(max_length=255, blank=True, null=True)
    special_requests = models.TextField(blank=True, null=True)
    
    property_type = models.CharField(max_length=50)
    parking_availability = models.CharField(max_length=20)
    access_instructions = models.TextField(blank=True, null=True)
    
    budget = models.CharField(max_length=50, blank=True, null=True)
    photo_video_permission = models.BooleanField(default=True)
    inspiration_links = models.URLField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} for {self.full_name} on {self.event_datetime.strftime('%Y-%m-%d')}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    
class OrderItemAddOn(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='selected_addons')
    addon = models.ForeignKey(AddOn, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
