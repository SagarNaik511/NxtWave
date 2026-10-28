import re

from django.utils.crypto import get_random_string

from .models import Ambassador, normalize_referral_code


def generate_unique_referral_code(name: str) -> str:
    """Generate an uppercase, shareable code without inventing any registrations."""
    base = re.sub(r"[^A-Z0-9]+", "-", name.strip().upper()).strip("-") or "AMBASSADOR"
    base = base[:24].strip("-") or "AMBASSADOR"
    while True:
        suffix = get_random_string(
            length=5,
            allowed_chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
        )
        candidate = f"AMB-{base}-{suffix}"
        if not Ambassador.objects.filter(referral_code=candidate).exists():
            return candidate


def get_active_ambassador(referral_code: str) -> Ambassador | None:
    normalized_code = normalize_referral_code(referral_code)
    if not normalized_code:
        return None
    return Ambassador.objects.filter(referral_code=normalized_code, is_active=True).first()

