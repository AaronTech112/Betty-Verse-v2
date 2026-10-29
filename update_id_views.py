import re

with open('core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"id": package.name.lower().replace(" ", "-"),', '"id": package_id_or_slug,')

with open('core/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated id mapping in views.py")
