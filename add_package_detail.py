import re

with open('core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add PackageDetailView if it doesn't exist
if 'class PackageDetailView' not in content:
    view_code = """
class PackageDetailView(TemplateView):
    template_name = 'package-detail.html'
"""
    # Find a place to insert it, maybe before PackagesView
    content = content.replace('class PackagesView(TemplateView):', view_code + '\nclass PackagesView(TemplateView):')
    
    with open('core/views.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added PackageDetailView to core/views.py")

with open('core/urls.py', 'r', encoding='utf-8') as f:
    urls_content = f.read()

# Import PackageDetailView
if 'PackageDetailView' not in urls_content:
    urls_content = urls_content.replace('PackagesView,', 'PackageDetailView,\n    PackagesView,')
    
    # Add path
    path_code = "path('package-detail/', PackageDetailView.as_view(), name='package_detail'),"
    urls_content = urls_content.replace("path('packages/', PackagesView.as_view(), name='packages'),", path_code + "\n    path('packages/', PackagesView.as_view(), name='packages'),")

    with open('core/urls.py', 'w', encoding='utf-8') as f:
        f.write(urls_content)
    print("Added package_detail to core/urls.py")
