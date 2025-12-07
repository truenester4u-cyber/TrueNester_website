# Supabase Edge Function Setup for Email Notifications

## Overview
This Edge Function automatically sends email notifications to your team when a new property inquiry is submitted.

**Emails will be sent to:**
- info@truenester.com
- truenester4u@gmail.com

---

## Step 1: Get Resend API Key (Free)

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month free)
3. Go to **API Keys** → **Create API Key**
4. Copy the API key (starts with `re_`)

---

## Step 2: Add Domain to Resend (Required for custom "from" address)

1. In Resend dashboard, go to **Domains**
2. Add `truenester.com`
3. Add the DNS records they provide to your domain
4. Wait for verification (usually 5-10 minutes)

**OR** use Resend's default sender temporarily:
- Change line 97 in `index.ts` from:
  ```
  from: "True Nester <inquiries@truenester.com>"
  ```
  to:
  ```
  from: "True Nester <onboarding@resend.dev>"
  ```

---

## Step 3: Deploy the Edge Function

Open terminal in your project folder and run:

```bash
# Login to Supabase CLI (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key as a secret
npx supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE

# Deploy the function
npx supabase functions deploy send-inquiry-email
```

---

## Step 4: Test the Function

1. Go to your website
2. Open any property detail page
3. Fill out the inquiry form
4. Submit
5. Check your email inbox (info@truenester.com)

---

## Troubleshooting

### Emails not arriving?
1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify RESEND_API_KEY is set correctly
3. Check spam folder
4. Verify domain is verified in Resend

### Function not found?
Make sure you deployed with:
```bash
npx supabase functions deploy send-inquiry-email
```

---

## Alternative: Use Supabase Database Trigger (No code changes needed)

You can also set up a PostgreSQL trigger that calls the Edge Function automatically whenever a new row is inserted into the `conversations` table. This is more reliable but requires SQL setup.

Contact your developer if you need this approach.
