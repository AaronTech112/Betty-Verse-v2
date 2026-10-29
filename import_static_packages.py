import os
import re
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bettyverse.settings")

import django  # noqa: E402

django.setup()

from core.models import AddOn, Package, PackageImage  # noqa: E402


def parse_decimal(value: str) -> Decimal:
    try:
        return Decimal(str(float(value)))
    except Exception:
        return Decimal("0.00")


def main() -> None:
    file_path = "/Users/admin/Documents/programming/betty-verse-BV/templates/packages.html"
    with open(file_path, "r", encoding="utf-8") as handle:
        html = handle.read()

    item_blocks = re.findall(
        r'<div class="col-lg-6 col-xl-4 mb-4 package-card-item"[^>]*>.*?</div>\s*</div>',
        html,
        flags=re.S,
    )
    attr_re = re.compile(r'data-([a-zA-Z0-9_-]+)="([^"]*)"')
    addon_input_re = re.compile(r'<input[^>]*class="package-addon-input"[^>]*>', flags=re.S)

    seen = set()
    parsed_count = 0
    created = 0
    updated = 0
    addons_created = 0

    for block in item_blocks:
        article_match = re.search(r'<article class="package-card"([^>]*)>', block, flags=re.S)
        if not article_match:
            continue
        parsed_count += 1

        article_attrs = dict(attr_re.findall(article_match.group(1)))
        container_match = re.search(
            r'<div class="col-lg-6 col-xl-4 mb-4 package-card-item"([^>]*)>',
            block,
            flags=re.S,
        )
        container_attrs = dict(attr_re.findall(container_match.group(1) if container_match else ""))

        name = (article_attrs.get("package-name") or "").strip()
        category = (article_attrs.get("package-category") or "").strip() or "general"
        if not name:
            continue

        unique_key = (name.lower(), category.lower())
        if unique_key in seen:
            continue
        seen.add(unique_key)

        summary = (article_attrs.get("package-summary") or "").strip()
        image_url = (article_attrs.get("package-image") or "").strip()
        gallery_image_urls = [
            (article_attrs.get("package-image2") or "").strip(),
            (article_attrs.get("package-image3") or "").strip(),
        ]
        tags = (container_attrs.get("tags") or "").strip()
        base_price = parse_decimal(
            (article_attrs.get("package-base-price") or article_attrs.get("package-price") or "0").strip()
        )

        package = Package.objects.filter(name=name, category=category).order_by("id").first()
        if package is None:
            package = Package.objects.create(
                name=name,
                category=category,
                base_price=base_price,
                summary=summary,
                image_url=image_url,
                status="published",
                tags=tags,
            )
            created += 1
        else:
            package.base_price = base_price
            package.summary = summary
            package.image_url = image_url
            package.status = "published"
            package.tags = tags
            package.save(update_fields=["base_price", "summary", "image_url", "status", "tags", "updated_at"])
            updated += 1

        package.gallery_images.all().delete()
        for index, gallery_image_url in enumerate([url for url in gallery_image_urls if url], start=1):
            PackageImage.objects.create(
                package=package,
                image_url=gallery_image_url,
                alt_text=f"{package.name} gallery image {index}",
                sort_order=index,
            )

        package.addons.all().delete()
        for addon_input in addon_input_re.findall(block):
            addon_attrs = dict(attr_re.findall(addon_input))
            addon_name = (addon_attrs.get("addon-name") or "").strip()
            addon_price = parse_decimal((addon_attrs.get("addon-price") or "0").strip())
            if not addon_name:
                continue
            AddOn.objects.create(package=package, name=addon_name, price=addon_price)
            addons_created += 1

    print(
        {
            "parsed_cards": parsed_count,
            "unique_packages_processed": len(seen),
            "created_packages": created,
            "updated_packages": updated,
            "addons_created": addons_created,
            "total_packages_in_db": Package.objects.count(),
        }
    )


if __name__ == "__main__":
    main()
