# Production Runtime Lock

This project is configured so production clinic data must use Supabase.

## Important rule

In production, the website must not silently fall back to local JSON files for critical medical data.

## Required production services

- Supabase database
- Supabase private storage buckets
- Supabase service role key in Vercel environment variables
- Resend for email
- Twilio Verify for mobile OTP
- Upstash Redis for rate limiting
- Vercel for deployment

## Development fallback

Local JSON fallback may exist only for development convenience.

## Production behavior

If Supabase environment variables are missing in production, critical clinic workflows should fail loudly instead of writing patient data into local files.

This is safer for real patient data because Vercel/serverless local files are not reliable permanent storage.