# Security Notes

## Implemented

- Password hashing with bcrypt-compatible flow
- Admin password hash through environment variable
- Required `AUTH_SECRET`
- Secure portal cookies
- Supabase service role used only server-side
- Row Level Security enabled in Supabase
- Private storage buckets for prescriptions and payment proofs
- Server-side upload validation
- OTP verification for mobile numbers
- Rate limiting with Upstash Redis when configured
- CSP and security headers through Next.js config

## Important Rules

- Never commit `.env.local`
- Never expose `SUPABASE_SERVICE_ROLE_KEY`
- Never expose `TWILIO_AUTH_TOKEN`
- Never expose `RESEND_API_KEY`
- Never expose `ADMIN_PASSWORD_HASH`
- Keep payment proof and prescription buckets private
- Verify UPI payments manually before marking Paid

## Future Hardening

- Admin two-factor authentication
- Detailed admin audit logs
- CSRF token or strict Origin validation on all mutation routes
- Remove development filesystem fallback in production-only mode
- Automated backup and retention policy
## Production Runtime Lock

- [x] Critical production data must use Supabase.
- [x] Appointment and prescription-visit stores no longer silently fall back to local JSON files when Supabase env variables are missing in production.
- [x] Local JSON fallback remains development-only.