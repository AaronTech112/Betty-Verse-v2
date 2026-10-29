import re

def inject_bootstrap_data(file_path, tag):
    with open('temp_templates/' + file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Insert just before the first <script> tag at the bottom
    content = re.sub(r'(<script src="{% static \'js/jquery.min.js\' %}")', f'{tag}\n      \\1', content)

    with open('temp_templates/' + file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Injected bootstrap data into {file_path}")

inject_bootstrap_data('cart.html', '{{ cart_bootstrap|json_script:"cart-bootstrap-data" }}')
inject_bootstrap_data('user-dashboard.html', '{{ dashboard_bootstrap|json_script:"dashboard-bootstrap-data" }}')
