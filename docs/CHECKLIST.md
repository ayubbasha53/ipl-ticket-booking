# Feature checklist (after Phases 1-2)

## Implemented and tested
- Monorepo, env validation (fails fast, production guards), Docker Mongo replica set
- 21 Mongoose models with indexes, enums, snapshots-ready booking schema, integer-paise money, partial unique indexes for refunds, check-ins, payments
- Idempotent DEMO seed (season, 10 teams, sample players, stadiums, matches, categories, placeholder tax rule, coupon, optional env-supplied admin)
- Register, duplicate prevention, email verification, resend, login (email or phone), remember-me, lockout, logout, forgot/reset, change password, profile update, session list/revoke/logout-all, role guard middleware, audit log, CSRF, security headers
- React: home, login, register, verify, forgot, reset, account page, legal pages, route guards, validation, toasts, responsive layout

## Needs credentials to go live
- SMTP email (Brevo/other). Until configured the app runs in visible demo mode
- Razorpay, SMS and Cloudinary (later phases)

## Not built yet
- Phone/SMS verification (needs an SMS provider adapter)
- Teams, players, matches, stadium and admin CRUD (Phase 3), holds (4), pricing/tax/coupons (5), payments/invoices (6), tickets/check-in/cancellation/refunds (7), admin UI and booking UI (8), end-to-end tests, deployment guide (9)
- Login currently works before email verification; booking will require a verified email

## Must be verified before any real use
- Legal copy (terms, privacy), tax treatment, authorised data/assets, penetration test, load test of seat holds
