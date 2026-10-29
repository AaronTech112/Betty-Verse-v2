import re

with open('temp_templates/user-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the logout button with the Django logout link
content = re.sub(
    r'<button[^>]*data-dashboard-logout[^>]*>Log Out</button>',
    r'<a class="hero-btn secondary" href="{% url \'logout\' %}" data-logout-link>Log Out</a>',
    content
)

with open('temp_templates/user-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed logout link in user-dashboard.html")
