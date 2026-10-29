import re

with open('templates/package-detail.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject the script tag right before <script src="{% static 'js/package-detail.js' %}"></script>
script_injection = """
      {% if package_json %}
      <script>
         window.localStorage.setItem('bettyverse-selected-package', '{{ package_json|escapejs }}');
      </script>
      {% endif %}
      <script src="{% static 'js/package-detail.js' %}"></script>
"""
content = content.replace('<script src="{% static \'js/package-detail.js\' %}"></script>', script_injection)

with open('templates/package-detail.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected package_json script into package-detail.html")
