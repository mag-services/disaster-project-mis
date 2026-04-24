# Two-Factor Authentication (2FA)

## Mandatory email OTP (default)

By default, **every login** requires a 6-digit code sent to the user's email after entering username and password. Users must have an email address on file.

**Admin:** Toggle "OTP required for all logins" in Admin → Users → SMTP settings. When disabled, users can optionally enable 2FA in their profile.

**Recovery:** Set `DISABLE_2FA_GLOBALLY=true` in your environment to bypass OTP entirely (e.g. when locked out).

## Per-user 2FA (optional)

When mandatory OTP is disabled, users can optionally enable two-factor authentication with either:

1. **Email code** – A 6-digit code sent to their email address
2. **Authenticator app** – Microsoft Authenticator

## Setup

### Backend

1. **Install dependencies** (already in `requirements.txt`):
   - `django-otp` – TOTP support
   - `pyotp` – OTP generation/verification
   - `qrcode[pil]` – QR code for authenticator setup

2. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Email (for email OTP)** – Configure Django email settings:
   - Local: Uses `console` backend (prints to terminal)
   - Production: Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`

4. **Cache** – OTP codes and TOTP setup secrets use Django cache. Default `LocMemCache` works for single-process. For multi-worker production, use Redis or DatabaseCache.

### User flow

1. **Login** (mandatory OTP enabled by default):
   - Enter username/password
   - A 6-digit code is sent to your email
   - Enter the code (or click "Resend code")
   - Click Verify

2. **Enable per-user 2FA** (when mandatory OTP is disabled) – Profile → Two-factor authentication:
   - **Email**: Requires email in profile. One-click enable.
   - **Authenticator**: Scan QR with app, enter 6-digit code to confirm.

3. **Disable 2FA** (per-user): Profile → enter password → Disable 2FA.

## Locked out (admin recovery)

If a user cannot complete 2FA (e.g. lost authenticator, clock drift), an admin can disable 2FA via management command:

```bash
# Disable for a specific user
docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py disable_2fa admin

# Disable for ALL users (use if unsure which account has 2FA)
docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py disable_2fa --all
```

**If you still see the 2FA screen after running disable_2fa:**
1. Click **"← Back to sign in"** and log in again from scratch (the 2FA step may be from a previous attempt).
2. Ensure you ran the command on the **same deployment** you're accessing (e.g. if the app is on a VM, run the command on the VM).
3. If you're unsure which username has 2FA, run `disable_2fa --all` to disable it for everyone.
4. **Nuclear option** – bypass 2FA entirely: add `DISABLE_2FA_GLOBALLY=true` to `deploy/vm/.env` (or export before `docker compose up`), rebuild/restart, then log in. Remove the setting after recovering.

## API endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api-token-auth/` | POST | No | Login. Returns `token` or `requires_2fa` + `temp_token` |
| `/api/v1/auth/verify-2fa/` | POST | No | Verify code, get token. Body: `{ temp_token, code }` |
| `/api/v1/auth/resend-email-otp/` | POST | No | Resend email code. Body: `{ temp_token }` |
| `/api/v1/auth/setup-totp/` | POST | Token | Start TOTP setup. Returns `secret`, `qr_svg` |
| `/api/v1/auth/setup-totp-verify/` | POST | Token | Verify TOTP, enable 2FA. Body: `{ code }` |
| `/api/v1/auth/setup-email-otp/` | POST | Token | Enable email 2FA |
| `/api/v1/auth/disable-2fa/` | POST | Token | Disable 2FA. Body: `{ password }` |
