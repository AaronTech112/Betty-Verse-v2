import os

for filename in os.listdir('templates'):
    if filename.endswith('.html'):
        filepath = os.path.join('templates', filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # We need to fix the broken template syntax caused by the sed command
        # It currently looks like:
        #                      <div class="login_bt"><a href="{% url 'login' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>
        #                      {% endif %}
        # And we need to add {% if not user.is_authenticated %} before it.
        
        if '{% if not user.is_authenticated %}' not in content:
            content = content.replace(
                '<div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% endif %}',
                '{% if not user.is_authenticated %}\n                     <div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                     {% endif %}'
            )
            
            # Also handle user-dashboard.html which might have different spacing
            content = content.replace(
                '<div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                      {% endif %}',
                '{% if not user.is_authenticated %}\n                      <div class="login_bt"><a href="{% url \'login\' %}">Login <span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span></a></div>\n                      {% endif %}'
            )
            
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed {filepath}")
