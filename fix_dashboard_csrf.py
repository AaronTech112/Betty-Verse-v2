import re

with open('temp_templates/user-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# For any <form ...> that does NOT have csrf_token immediately after, inject it.
# It's easier to just inject it after <form ...> if it's not already there.
def add_csrf(match):
    tag = match.group(0)
    # Check if the next few characters already have csrf_token
    # We will just replace and then clean up duplicates if any
    return tag + '\n                              {% csrf_token %}'

content = re.sub(r'<form[^>]*>', add_csrf, content)
# Clean up duplicates
content = content.replace('{% csrf_token %}\n                              {% csrf_token %}', '{% csrf_token %}')

with open('temp_templates/user-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected csrf tokens into user-dashboard.html")
