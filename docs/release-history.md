# Content X release history

This file is a safe public note for rollback planning. It does not contain
private credentials, environment values, or private client data.

## Current working release

- `clean-placeholders-otp-usd-1` — replaces pre-payment demo videos with
  placeholder workflow cards, keeps automatic currency hidden from the pricing
  controls, tunes USD rounding, and simplifies account/OTP login copy.

## Previous working release

- `demo-share-usd-1` — demo dashboard without login, improved share-link panel,
  auto INR/USD pricing, USD Razorpay order support, pre-payment tutorial videos,
  and smoother revision workflow cues.

## Previous live release

- `pricing-security-dashboard-1` — rounded USD display, security messaging,
  owner/team permission UI, and account dashboard improvements.

## Rollback approach

Use the saved Sites version or Git commit history to roll back. Do not copy old
site folders into the live app, because duplicate old source can confuse future
deployments and may accidentally keep outdated security behavior.
