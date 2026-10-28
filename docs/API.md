# API (Phases 1-2)

Base path `/api`. JSON in and out. Errors: `{ "error": { "code", "message", "fields"? } }`.
State-changing requests need the `X-CSRF-Token` header equal to the `ipl_csrf` cookie (call `GET /api/csrf` once to get it).
Session cookie: `ipl_session` (httpOnly).

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /health | none | Liveness |
| GET | /csrf | none | Sets CSRF cookie |
| GET | /system/status | none | Reports whether email/SMS/payments are live or demo |
| POST | /auth/register | none | name, email, phone (+E.164), password, confirmPassword, acceptTerms. 409 `duplicate_account` with `details.fields` |
| POST | /auth/login | none | identifier (email or phone), password, rememberMe. 401 generic, 429 when locked |
| POST | /auth/logout | cookie | Revokes the session |
| POST | /auth/verify-email | none | `{ token }`, single use, 24h |
| POST | /auth/resend-verification | none | `{ email }`, generic response, 60s cooldown |
| POST | /auth/forgot-password | none | `{ email }`, generic response |
| POST | /auth/reset-password | none | `{ token, password, confirmPassword }`, single use, 30 min, revokes all sessions |
| GET | /users/me | user | Profile |
| PATCH | /users/me | user | name, phone, transactionalNotifications, marketingNotifications. Unknown keys (such as `role`) rejected |
| PATCH | /users/me/password | user | currentPassword, newPassword, confirmPassword. Other sessions revoked |
| GET | /users/me/sessions | user | Active sessions |
| DELETE | /users/me/sessions/:sid | user | End one session |
| POST | /users/me/logout-all | user | End every session |

Passwords: 10-72 chars with lower, upper, digit and symbol.
