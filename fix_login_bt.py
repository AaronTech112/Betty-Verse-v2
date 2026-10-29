import os
import re

for filename in os.listdir('templates'):
    if filename.endswith('.html'):
        filepath = os.path.join('templates', filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # We want to replace:
        # {% if user.is_authenticated %}
        # <div class="login_bt" style="display: none;"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        # {% else %}
        # <div class="login_bt"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        # {% endif %}
        
        # With:
        # {% if not user.is_authenticated %}
        # <div class="login_bt"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        # {% endif %}
        
        pattern = r'\{%\s*if\s+user\.is_authenticated\s*%\}\s*<div\s+class="login_bt"[^>]*>.*?</div>\s*\{%\s*else\s*%\}\s*(<div\s+class="login_bt">.*?</div>)\s*\{%\s*endif\s*%\}'
        
        new_content = re.sub(pattern, r'{% if not user.is_authenticated %}\n                      \1\n                      {% endif %}', content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
