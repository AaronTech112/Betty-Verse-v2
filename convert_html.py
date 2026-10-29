import os
import re

src_dir = "updated design-betty-verse-BV"
dest_dir = "temp_templates"
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)
if not os.path.exists(os.path.join(dest_dir, "login")):
    os.makedirs(os.path.join(dest_dir, "login"))

def process_file(src_path, dest_path):
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Prepend {% load static %} if not present
    if '{% load static %}' not in content:
        content = '{% load static %}\n' + content

    # Replace static files
    # Use lambda to avoid escaping issues
    content = re.sub(r'href="(css/[^"]+)"', lambda m: f'href="{{% static \'{m.group(1)}\' %}}"', content)
    content = re.sub(r'src="(js/[^"]+)"', lambda m: f'src="{{% static \'{m.group(1)}\' %}}"', content)
    content = re.sub(r'src="(images/[^"]+)"', lambda m: f'src="{{% static \'{m.group(1)}\' %}}"', content)
    content = re.sub(r'href="(images/[^"]+)"', lambda m: f'href="{{% static \'{m.group(1)}\' %}}"', content)

    # Note: there might be background-image: url('images/...')
    content = re.sub(r'url\([\'"]?(images/[^\'"]+)[\'"]?\)', lambda m: f'url({{% static \'{m.group(1)}\' %}})', content)
    
    # Replace URLs
    content = content.replace('href="index.html"', 'href="{% url \'home\' %}"')
    content = content.replace('href="about.html"', 'href="{% url \'about\' %}"')
    content = content.replace('href="packages.html"', 'href="{% url \'packages\' %}"')
    content = content.replace('href="services.html"', 'href="{% url \'services\' %}"')
    content = content.replace('href="blog.html"', 'href="{% url \'blog\' %}"')
    content = content.replace('href="booking.html"', 'href="{% url \'booking\' %}"')
    content = content.replace('href="cart.html"', 'href="{% url \'cart\' %}"')
    
    # query params
    content = re.sub(r'href="packages\.html\?filter=([^"]+)"', lambda m: f'href="{{% url \'packages\' %}}?filter={m.group(1)}"', content)

    # login paths
    content = content.replace('href="login/login_index.html"', 'href="{% url \'login\' %}"')
    content = content.replace('href="signup.html"', 'href="{% url \'signup\' %}"')
    content = content.replace('href="../index.html"', 'href="{% url \'home\' %}"')
    content = content.replace('href="../login/signup.html"', 'href="{% url \'signup\' %}"')
    content = content.replace('href="../login/login_index.html"', 'href="{% url \'login\' %}"')

    # Fix the form inline header
    # search form
    search_form_old = '<form class="form-inline my-2 my-lg-0">'
    search_form_new = '<form class="form-inline my-2 my-lg-0">\n                              {% csrf_token %}'
    content = content.replace(search_form_old, search_form_new)

    # header login button logic
    login_btn_old = '<div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>'
    login_btn_new = '{% if user.is_authenticated %}\n                     <div class="login_bt"><a href="{% url \'dashboard\' %}">My Account <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% else %}\n                     <div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% endif %}'
    content = content.replace(login_btn_old, login_btn_new)

    # newsletter form
    nl_form_old = '<form class="footer_newsletter_form" action="#" method="post" novalidate>'
    nl_form_new = '<form class="footer_newsletter_form" method="post" novalidate>\n                              {% csrf_token %}'
    content = content.replace(nl_form_old, nl_form_new)

    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.html'):
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, src_dir)
            dest_path = os.path.join(dest_dir, rel_path)
            process_file(src_path, dest_path)
            print(f"Processed {rel_path}")

