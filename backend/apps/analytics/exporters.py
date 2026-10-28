import csv
import re
from datetime import datetime
from io import StringIO

from django.http import HttpResponse
from django.utils import timezone

from .services import ambassador_metrics, daily_metrics, PeriodSelection


def campaign_csv_response(selection: PeriodSelection) -> HttpResponse:
    daily = daily_metrics(selection=selection)
    ambassadors = ambassador_metrics(selection=selection)
    generated_at = timezone.localtime().isoformat()
    report_start = selection.start_date.isoformat() if selection.start_date else ""
    report_end = selection.end_date.isoformat() if selection.end_date else ""
    output = StringIO(newline="")
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(
        [
            "report_type",
            "report_date",
            "ambassador_name",
            "referral_code",
            "registrations",
            "share_of_selected_registrations",
            "unattributed_registrations",
            "report_start_date",
            "report_end_date",
            "generated_at",
        ]
    )
    writer.writerow(
        [
            "summary",
            "",
            "",
            "",
            ambassadors["total_registrations"],
            "",
            ambassadors["unattributed_registrations"],
            report_start,
            report_end,
            generated_at,
        ]
    )
    for point in daily["daily"]:
        writer.writerow(["daily", point["date"], "", "", point["registrations"], "", "", report_start, report_end, generated_at])
    for ambassador in ambassadors["ambassadors"]:
        writer.writerow(
            [
                "ambassador",
                "",
                ambassador["name"],
                ambassador["referral_code"],
                ambassador["registration_count"],
                ambassador["share_of_total_registrations"],
                "",
                report_start,
                report_end,
                generated_at,
            ]
        )

    safe_period = re.sub(r"[^a-z0-9_-]+", "-", selection.key.lower()).strip("-") or "report"
    filename = f"ai-sprint-{safe_period}-report-{datetime.now().date().isoformat()}.csv"
    response = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
