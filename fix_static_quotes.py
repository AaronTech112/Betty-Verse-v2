import os

def fix_quotes(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    content = content.replace("\\'", "'")
    content = content.replace('href="login_index.html"', 'href="{% url \'login\' %}"')
    content = content.replace('href="signup.html"', 'href="{% url \'signup\' %}"')
    content = content.replace('src="../images/', 'src="{% static \'images/')

    with open(file_path, 'w') as f:
        f.write(content)

for root, _, files in os.walk('templates'):
    for file in files:
        if file.endswith('.html'):
            fix_quotes(os.path.join(root, file))
