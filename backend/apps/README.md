# Future Django apps

The domain is intentionally separated into these future app boundaries:

- `registrations`: student registration persistence and validation.
- `referrals`: referral code generation, attribution, and successful referral events.
- `analytics`: persisted-record metrics and administrator dashboard APIs.
- `campaigns`: campaign configuration, targets, channels, and exports.

These apps are not added to `INSTALLED_APPS` until their models and API behavior are implemented in later sections.

