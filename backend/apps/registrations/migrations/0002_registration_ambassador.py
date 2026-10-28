import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("referrals", "0001_initial"),
        ("registrations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="registration",
            name="ambassador",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="referred_registrations",
                to="referrals.ambassador",
            ),
        ),
    ]

