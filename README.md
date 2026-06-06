# Arogya Speech Therapy & Hearing Care Website

Professional Next.js website for Arogya Speech Therapy & Hearing Care .

## What is included

- Responsive medical landing page
- Hero section with strong appointment call-to-action
- About doctor section
- Services section
- Patient-care and treatment-process sections
- Hearing aid section
- Appointment form with email support through Resend
- WhatsApp fallback for appointment requests
- FAQ section
- Contact and map section
- SEO metadata and MedicalBusiness structured data

## Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

Create `.env.local` from `.env.example` and add real values:

```env
RESEND_API_KEY=re_your_real_resend_api_key
APPOINTMENT_EMAIL=client-email@example.com
```

The appointment API will work in preview mode without these values, but real email delivery needs valid Resend settings.

## Production check

Run before delivery:

```bash
npm run typecheck
npm run build
```

If `next build` fails with an SWC binary error, delete `node_modules` and `.next`, then reinstall dependencies on your own computer:

```powershell
Remove-Item node_modules, .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

## Client handover checklist

- Replace the clinic email inside `.env.local`.
- Add the real Resend API key.
- Confirm phone numbers: `9755018656`, `9755018656`.
- Confirm clinic address and Google Map location.
- Replace stock images with real clinic/doctor images if available.
- Confirm exact doctor qualification text before final publishing.
- Connect the site to the client domain.
- Test appointment form, WhatsApp button, phone buttons, and mobile menu.


## Final Production Upgrade

This project now includes admin/client portals, appointment CRM, chatbot, Supabase-ready production storage, privacy policy and client handoff files.

Read these files before delivery:

- `FINAL_PRODUCTION_GUIDE.md`
- `CLIENT_HANDOFF_CHECKLIST.md`
- `supabase/schema.sql`

Admin URLs:

- `/portal`
- `/admin/login`
- `/admin/dashboard`
- `/admin/appointments`
- `/client/login`
- `/client/dashboard`


