import json
import os
import re

with open('core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace PackageDetailView
view_code = """
import json
from django.utils.text import slugify

class PackageDetailView(TemplateView):
    template_name = 'package-detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        package_id_or_slug = self.request.GET.get('id')
        package = None
        
        if package_id_or_slug:
            for p in Package.objects.filter(status="published").prefetch_related("addons"):
                slug = p.name.lower().replace(" ", "-")
                if slugify(p.name) == package_id_or_slug or slug == package_id_or_slug or str(p.id) == package_id_or_slug:
                    package = p
                    break
        
        if package:
            package_data = {
                "id": package.name.lower().replace(" ", "-"),
                "name": package.name,
                "category": package.category,
                "summary": package.summary,
                "image": _resolve_package_image_url(package),
                "images": [_resolve_package_image_url(package)],
                "basePrice": float(package.base_price),
                "price": float(package.base_price),
                "highlights": [],
                "addons": [
                    {"name": addon.name, "price": float(addon.price)}
                    for addon in package.addons.all()
                ],
                "selectedAddons": []
            }
            context['package_json'] = json.dumps(package_data)
        
        return context
"""

content = re.sub(r'class PackageDetailView\(TemplateView\):\n    template_name = \'package-detail\.html\'\n', view_code, content)

with open('core/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PackageDetailView in core/views.py")
