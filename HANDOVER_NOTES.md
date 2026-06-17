# Arogya Speech Therapy & Hearing Care Website - Handover Notes

## Delivered Modules

1. Public website with service, contact, review, FAQ and clinic information sections.
2. Client portal with registration, login, OTP verification, profile, appointment and prescription access.
3. Admin portal with dashboard, appointments, reviews, prescriptions, patient history and payment verification.
4. Appointment booking with physical and online consultation options.
5. Smart Prescription Sheets for online and offline patients.
6. QR-based printed prescription workflow.
7. Scanner upload for handwritten prescriptions.
8. Digital prescription writing using mouse/tablet pen.
9. Secure prescription/report download pages.
10. Manual UPI payment submission and admin verification.
11. Email-based appointment communication and password reset.
12. Twilio Verify mobile OTP.
13. Supabase database/storage with RLS and private buckets.
14. Vercel production deployment setup.

## Operational Notes

- Patient appointment and prescription records are managed through Supabase.
- Prescription and payment proof storage buckets are private.
- UPI payments are manually verified by clinic staff.
- Appointment SMS is not included because OTP uses Twilio Verify. Custom SMS requires a separate DLT-compliant SMS provider or Twilio Programmable Messaging setup.
- Automatic payment verification is not included. Razorpay or PhonePe gateway can be added later.

## Recommended Admin Routine

1. Check new appointments daily.
2. For walk-in patients, create Smart Prescription Sheet from admin.
3. For handwritten prescriptions, use Scanner Upload.
4. For online consultation, use Write Digitally if needed.
5. Verify UPI payments from bank/UPI app before marking Paid.
6. Approve reviews only after checking content.
7. Keep admin password private and rotate if staff changes.

## Future Upgrade Roadmap

- Admin two-factor authentication
- Admin audit logs
- Automated payment gateway
- WhatsApp reminders
- Appointment SMS
- Doctor dashboard
- Advanced reports and analytics