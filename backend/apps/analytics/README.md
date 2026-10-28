# Analytics app

Contains persisted-record metrics, target progress, ambassador leaderboard APIs, reporting-period filters, and aggregate CSV export for the authenticated growth dashboard. Campaign configuration is owned by `apps.campaigns`.

All analytics endpoints require DRF token authentication and `is_staff=True`. They accept `period=all_time`, `period=campaign`, or a validated custom range. All-time goal progress remains separate from selected-period performance. Daily dates are interpreted in the persisted campaign timezone, with an inclusive date range represented by an exclusive next-day database boundary.

