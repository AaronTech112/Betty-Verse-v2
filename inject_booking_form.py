import re

def extract_form(content):
    match = re.search(r'<form class="modern_form booking_form".*?</form>', content, re.DOTALL)
    return match.group(0) if match else None

with open('templates/booking.html', 'r', encoding='utf-8') as f:
    old_content = f.read()

with open('temp_templates/booking.html', 'r', encoding='utf-8') as f:
    new_content = f.read()

old_form = extract_form(old_content)

# We also need to get the messages and errors from the old content, which are right above the form
match_messages = re.search(r'({% if messages %}.*?{% endif %}\s*{% if form\.errors %}.*?{% endif %}\s*)<form', old_content, re.DOTALL)
if match_messages:
    old_form = match_messages.group(1) + old_form

new_form_match = re.search(r'<form class="modern_form booking_form".*?</form>', new_content, re.DOTALL)
if new_form_match:
    new_content = new_content[:new_form_match.start()] + old_form + new_content[new_form_match.end():]

with open('temp_templates/booking.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected old form into booking.html")
