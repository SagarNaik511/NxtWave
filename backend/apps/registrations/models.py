from django.core.validators import MinValueValidator
from django.db import models


class Registration(models.Model):
    full_name = models.CharField(max_length=160)
    email = models.EmailField(max_length=254, unique=True)
    college_name = models.CharField(max_length=200)
    branch = models.CharField(max_length=120)
    graduation_year = models.PositiveSmallIntegerField(validators=[MinValueValidator(2000)])
    ambassador = models.ForeignKey(
        "referrals.Ambassador",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="referred_registrations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(graduation_year__gte=2000),
                name="registration_graduation_year_gte_2000",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

