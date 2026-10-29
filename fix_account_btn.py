import os
import re

for filename in os.listdir('templates'):
    if filename.endswith('.html'):
        filepath = os.path.join('templates', filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Current pattern:
        # {% if not user.is_authenticated %}
        # <div class="login_bt"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        # {% endif %}
        
        # Or:
        # {% if not user.is_authenticated %}
        #                      <div class="login_bt"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        #                      {% endif %}
        
        pattern = r'\{%\s*if\s+not\s+user\.is_authenticated\s*%\}\s*(<div\s+class="login_bt">.*?</div>)\s*\{%\s*endif\s*%\}'
        
        def replacement(match):
            indent = "                     " # rough indentation
            return f"""{{% if user.is_authenticated %}}
{indent}<div class="login_bt"><a href="{{% url 'dashboard' %}}">Account <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
{indent}{{% else %}}
{indent}{match.group(1)}
{indent}{{% endif %}}"""

        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
