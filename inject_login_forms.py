import re

def inject_form(file_path):
    with open('templates/' + file_path, 'r', encoding='utf-8') as f:
        old_content = f.read()

    with open('temp_templates/' + file_path, 'r', encoding='utf-8') as f:
        new_content = f.read()

    match = re.search(r'<form.*?</form>', old_content, re.DOTALL)
    if not match:
        return
    old_form = match.group(0)

    new_form_match = re.search(r'<form.*?</form>', new_content, re.DOTALL)
    if new_form_match:
        new_content = new_content[:new_form_match.start()] + old_form + new_content[new_form_match.end():]

    with open('temp_templates/' + file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Injected old form into {file_path}")

inject_form('login/login_index.html')
inject_form('login/signup.html')
