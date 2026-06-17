# Arogya Website Production Checklist

## Final Build Status

- [x] `npm run typecheck` passed
- [x] `npm run build` passed
- [x] Git working tree clean before delivery
- [x] GitHub connected to Vercel deployment

## Environment Variables

Confirmed in Vercel Production:

- [x] `AUTH_SECRET`
- [x] `ADMIN_EMAIL`
- [x] `ADMIN_PASSWORD_HASH`
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `RESEND_API_KEY`
- [x] `CRON_SECRET`
- [x] `TWILIO_ACCOUNT_SID`
- [x] `TWILIO_AUTH_TOKEN`
- [x] `TWILIO_VERIFY_SERVICE_SID`
- [x] `UPSTASH_REDIS_REST_URL`
- [x] `UPSTASH_REDIS_REST_TOKEN`
- [x] `NEXT_PUBLIC_CLINIC_UPI_ID`
- [x] `NEXT_PUBLIC_CLINIC_UPI_NAME`
- [x] `NEXT_PUBLIC_CLINIC_UPI_QR`

## Supabase Security

- [x] Important medical tables exist
- [x] Row Level Security enabled on important medical tables
- [x] Service role policies exist
- [x] `prescriptions` bucket is private
- [x] `payment-proofs` bucket is private
- [x] `payment-proofs` allows JPG, PNG, WEBP, PDF and 10 MB max size

## Core Features

- [x] Client registration/login
- [x] Mobile OTP verification
- [x] Forgot password
- [x] Admin login/dashboard
- [x] Appointment booking
- [x] Physical and online appointment support
- [x] Smart Prescription Sheets
- [x] QR prescription print sheet
- [x] Scanner upload for handwritten prescriptions
- [x] Digital prescription writing with mouse/tablet pen
- [x] Client prescription download
- [x] Admin patient history
- [x] Manual UPI payment submission
- [x] Admin payment verification
- [x] Review system
- [x] Sitemap and robots routes

## Manual Testing Required Before Handover

- [ ] Register new client account
- [ ] Verify mobile OTP
- [ ] Book physical appointment
- [ ] Confirm RX appears in Smart Prescription Sheets
- [ ] Print prescription sheet
- [ ] Upload scanned prescription
- [ ] Confirm prescription appears in client dashboard
- [ ] Book online appointment
- [ ] Use digital prescription writing
- [ ] Confirm digital prescription appears in client dashboard
- [ ] Submit UPI payment proof/reference
- [ ] Mark payment paid from admin
- [ ] Confirm client dashboard shows payment paid
- [ ] Test forgot password
- [ ] Test admin logout/login

## Known Future Enhancements

- [x] Admin two-factor authentication with email OTP
- Admin audit logs for sensitive actions
- Automatic Razorpay/PhonePe payment gateway
- Appointment confirmation SMS through DLT-compliant SMS provider
- WhatsApp reminder automation
- Doctor-specific dashboard
- Advanced analytics
## Admin 2FA

- [x] Admin login requires password first
- [x] Admin login then requires email OTP
- [x] OTP challenge expires after 10 minutes
- [x] OTP challenge is stored hashed
- [x] Admin dashboard cookies are issued only after OTP verification
## CSRF / Origin Protection

- [x] Same-origin request guard added.
- [x] Sensitive mutation routes patched.