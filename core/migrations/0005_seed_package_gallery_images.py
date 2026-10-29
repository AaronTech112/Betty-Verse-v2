from django.db import migrations


GALLERY_SEED_DATA = {
    "Betty And Confetti - Neon Luxe Arch": [
        {
            "image_url": "images/added_bday.jpeg",
            "alt_text": "Betty And Confetti - Neon Luxe Arch alternate view",
            "sort_order": 1,
        },
    ],
}


def seed_package_gallery_images(apps, schema_editor):
    Package = apps.get_model("core", "Package")
    PackageImage = apps.get_model("core", "PackageImage")

    for package_name, rows in GALLERY_SEED_DATA.items():
        package = Package.objects.filter(name=package_name).first()
        if not package:
            continue
        for row in rows:
            image = PackageImage.objects.filter(
                package=package,
                image_url=row["image_url"],
            ).first()
            if image:
                image.alt_text = row["alt_text"]
                image.sort_order = row["sort_order"]
                image.save(update_fields=["alt_text", "sort_order"])
                continue
            PackageImage.objects.create(package=package, **row)


def unseed_package_gallery_images(apps, schema_editor):
    Package = apps.get_model("core", "Package")
    PackageImage = apps.get_model("core", "PackageImage")

    for package_name, rows in GALLERY_SEED_DATA.items():
        package = Package.objects.filter(name=package_name).first()
        if not package:
            continue
        image_urls = [row["image_url"] for row in rows]
        PackageImage.objects.filter(package=package, image_url__in=image_urls).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_packageimage"),
    ]

    operations = [
        migrations.RunPython(seed_package_gallery_images, unseed_package_gallery_images),
    ]
