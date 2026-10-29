import re

with open('updated design-betty-verse-BV/booking.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will just re-run the convert logic for booking.html here
content = '{% load static %}\n' + content
content = re.sub(r'href="(css/[^"]+)"', lambda m: f'href="{{% static \'{m.group(1)}\' %}}"', content)
content = re.sub(r'src="(js/[^"]+)"', lambda m: f'src="{{% static \'{m.group(1)}\' %}}"', content)
content = re.sub(r'src="(images/[^"]+)"', lambda m: f'src="{{% static \'{m.group(1)}\' %}}"', content)
content = re.sub(r'href="(images/[^"]+)"', lambda m: f'href="{{% static \'{m.group(1)}\' %}}"', content)
content = re.sub(r'url\([\'"]?(images/[^\'"]+)[\'"]?\)', lambda m: f'url({{% static \'{m.group(1)}\' %}})', content)
content = content.replace('href="index.html"', 'href="{% url \'home\' %}"')
content = content.replace('href="about.html"', 'href="{% url \'about\' %}"')
content = content.replace('href="packages.html"', 'href="{% url \'packages\' %}"')
content = content.replace('href="services.html"', 'href="{% url \'services\' %}"')
content = content.replace('href="blog.html"', 'href="{% url \'blog\' %}"')
content = content.replace('href="booking.html"', 'href="{% url \'booking\' %}"')
content = content.replace('href="cart.html"', 'href="{% url \'cart\' %}"')
content = re.sub(r'href="packages\.html\?filter=([^"]+)"', lambda m: f'href="{{% url \'packages\' %}}?filter={m.group(1)}"', content)
content = content.replace('href="login/login_index.html"', 'href="{% url \'login\' %}"')
content = content.replace('<form class="form-inline my-2 my-lg-0">', '<form class="form-inline my-2 my-lg-0">\n                              {% csrf_token %}')
login_btn_old = '<div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>'
login_btn_new = '{% if user.is_authenticated %}\n                     <div class="login_bt"><a href="{% url \'dashboard\' %}">My Account <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% else %}\n                     <div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% endif %}'
content = content.replace(login_btn_old, login_btn_new)
content = content.replace('<form class="footer_newsletter_form" action="#" method="post" novalidate>', '<form class="footer_newsletter_form" method="post" novalidate>\n                              {% csrf_token %}')

# Fix the booking form tag
content = content.replace('<form class="modern_form booking_form" action="#">', '<form class="modern_form booking_form" method="post">\n                              {% csrf_token %}')

# Inject messages and form errors right after the form opening tag
messages_and_errors = """
                        {% if messages %}
                        <div class="messages">
                           {% for message in messages %}
                           <div class="alert alert-{{ message.tags }}">
                              {{ message }}
                           </div>
                           {% endfor %}
                        </div>
                        {% endif %}
                        {% if form.errors %}
                        <div class="alert alert-danger">
                           <strong>Please correct the errors below.</strong>
                           {% if form.non_field_errors %}
                              <ul class="mb-0">
                                 {% for error in form.non_field_errors %}
                                 <li>{{ error }}</li>
                                 {% endfor %}
                              </ul>
                           {% endif %}
                           <ul class="mb-0">
                              {% for field in form %}
                                 {% for error in field.errors %}
                                 <li><strong>{{ field.label }}:</strong> {{ error }}</li>
                                 {% endfor %}
                              {% endfor %}
                           </ul>
                        </div>
                        {% endif %}
"""
content = content.replace('<form class="modern_form booking_form" method="post">\n                              {% csrf_token %}', '<form class="modern_form booking_form" method="post">\n                              {% csrf_token %}' + messages_and_errors)

# Replace inputs to retain backend names and values
content = content.replace('name="name"', 'name="full_name" value="{{ form.full_name.value|default_if_none:\'\' }}"')
content = content.replace('name="phone"', 'name="phone" value="{{ form.phone.value|default_if_none:\'\' }}"')
content = content.replace('name="email"', 'name="email" value="{{ form.email.value|default_if_none:\'\' }}"')

content = content.replace('name="eventType"', 'name="event_type" value="{{ form.event_type.value|default_if_none:\'\' }}"')
content = content.replace('name="eventDateTime"', 'name="event_datetime" value="{{ form.event_datetime.value|default_if_none:\'\' }}"')
content = content.replace('name="fullAddress"', 'name="event_location_note"')
content = content.replace('name="theme"', 'name="theme" value="{{ form.theme.value|default_if_none:\'\' }}"')
content = content.replace('name="occasionDetails"', 'name="occasion_details" value="{{ form.occasion_details.value|default_if_none:\'\' }}"')
content = content.replace('name="inspirationLinks"', 'name="inspiration_links" value="{{ form.inspiration_links.value|default_if_none:\'\' }}"')
content = content.replace('name="propertyType"', 'name="property_type"')
content = content.replace('name="parkingAvailability"', 'name="parking_availability"')
content = content.replace('name="accessInstructions"', 'name="access_instructions"')
content = content.replace('name="budget"', 'name="budget" value="{{ form.budget.value|default_if_none:\'\' }}"')
content = content.replace('name="photoVideoPermission"', 'name="photo_video_permission"')
content = content.replace('name="specialRequests"', 'name="special_requests"')

# Select values logic
content = content.replace('<option value="home">', '<option value="home" {% if form.property_type.value == \'home\' %}selected{% endif %}>')
content = content.replace('<option value="hotel">', '<option value="hotel" {% if form.property_type.value == \'hotel\' %}selected{% endif %}>')
content = content.replace('<option value="airbnb">', '<option value="airbnb" {% if form.property_type.value == \'airbnb\' %}selected{% endif %}>')
content = content.replace('<option value="venue">', '<option value="venue" {% if form.property_type.value == \'venue\' %}selected{% endif %}>')

content = content.replace('<option value="yes">', '<option value="yes" {% if form.parking_availability.value == \'yes\' %}selected{% endif %}>')
content = content.replace('<option value="limited">', '<option value="limited" {% if form.parking_availability.value == \'limited\' %}selected{% endif %}>')
content = content.replace('<option value="no">', '<option value="no" {% if form.parking_availability.value == \'no\' %}selected{% endif %}>')

# Fix checkboxes
content = content.replace('<input type="checkbox"> <span>Travel fees may apply</span>', '<input type="checkbox" name="travel_fees_ack" required> <span>Travel fees may apply</span>')
content = content.replace('<input type="checkbox"> <span>Deposit required to secure booking</span>', '<input type="checkbox" name="deposit_required_ack" required> <span>Deposit required to secure booking</span>')


with open('temp_templates/booking.html', 'w', encoding='utf-8') as f:
    f.write(content)
