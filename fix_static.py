import os
import re

def replace_static(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    if '{% load static %}' not in content:
        content = '{% load static %}\n' + content

    content = re.sub(r'href="(css/[^"]+)"', r'href="{% static \'\1\' %}"', content)
    content = re.sub(r'href="(images/[^"]+)"', r'href="{% static \'\1\' %}"', content)
    content = re.sub(r'src="(images/[^"]+)"', r'src="{% static \'\1\' %}"', content)
    content = re.sub(r'src="(js/[^"]+)"', r'src="{% static \'\1\' %}"', content)
    
    if 'login' in file_path:
        content = re.sub(r'href="login_style.css"', r'href="{% static \'login/login_style.css\' %}"', content)
        content = re.sub(r'src="login_script.js"', r'src="{% static \'login/login_script.js\' %}"', content)
    if 'admin-panel' in file_path:
        content = re.sub(r'href="admin.css"', r'href="{% static \'admin-panel/admin.css\' %}"', content)
        content = re.sub(r'src="admin.js"', r'src="{% static \'admin-panel/admin.js\' %}"', content)
        content = re.sub(r'src="\.\./images/', r'src="{% static \'images/', content)

    # Forms
    content = re.sub(r'action="#"', r'method="post"', content)
    if '{% csrf_token %}' not in content:
        content = re.sub(r'(<form[^>]*>)', r'\1\n                              {% csrf_token %}', content)

    # URLs
    content = content.replace('href="index.html"', 'href="{% url \'home\' %}"')
    content = content.replace('href="login/login_index.html"', 'href="{% url \'login\' %}"')
    content = content.replace('href="signup.html"', 'href="{% url \'signup\' %}"')
    content = content.replace('href="../index.html"', 'href="{% url \'home\' %}"')

    with open(file_path, 'w') as f:
        f.write(content)

for root, _, files in os.walk('templates'):
    for file in files:
        if file.endswith('.html'):
            replace_static(os.path.join(root, file))
