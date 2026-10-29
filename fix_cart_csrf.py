import re

with open('temp_templates/cart.html', 'r', encoding='utf-8') as f:
    content = f.read()

def add_csrf(match):
    tag = match.group(0)
    return tag + '\n                              {% csrf_token %}'

content = re.sub(r'<form[^>]*>', add_csrf, content)
content = content.replace('{% csrf_token %}\n                              {% csrf_token %}', '{% csrf_token %}')

with open('temp_templates/cart.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected csrf tokens into cart.html")
