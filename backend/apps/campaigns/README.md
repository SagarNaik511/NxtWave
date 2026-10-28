# Campaigns app

Owns the database-backed `CampaignSettings` singleton used by analytics. Environment variables are used only as first-run defaults: campaign name, target, duration, budget, optional start date, and timezone. The protected analytics campaign endpoint is the administrator editing surface; public users cannot change these values.

