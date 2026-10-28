from .models import Ambassador, normalize_referral_code


def get_active_ambassador(referral_code: str) -> Ambassador | None:
    normalized_code = normalize_referral_code(referral_code)
    if not normalized_code:
        return None
    return Ambassador.objects.filter(referral_code=normalized_code, is_active=True).first()

