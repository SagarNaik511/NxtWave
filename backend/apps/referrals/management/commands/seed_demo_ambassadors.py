from django.core.management.base import BaseCommand

from apps.referrals.models import Ambassador, normalize_referral_code


DEMO_AMBASSADORS = [
    {
        "name": "Demo Ambassador 1",
        "referral_code": "AMB101",
        "college_name": "Demo Institute of Technology",
    },
    {
        "name": "Demo Ambassador 2",
        "referral_code": "AMB102",
        "college_name": "Demo College of Engineering",
    },
    {
        "name": "Demo Ambassador 3",
        "referral_code": "AMB103",
        "college_name": "Demo School of Computing",
    },
]


class Command(BaseCommand):
    help = "Create or update the three clearly labeled demo ambassadors."

    def handle(self, *args, **options):
        for ambassador_data in DEMO_AMBASSADORS:
            referral_code = normalize_referral_code(ambassador_data["referral_code"])
            ambassador, created = Ambassador.objects.update_or_create(
                referral_code=referral_code,
                defaults={
                    "name": ambassador_data["name"],
                    "college_name": ambassador_data["college_name"],
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} demo ambassador {ambassador.referral_code}: {ambassador.name}")

        self.stdout.write(self.style.SUCCESS("Demo ambassador seed completed; no registrations were created."))

