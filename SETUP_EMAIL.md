# Email Notification Setup Guide

## Why Email Wasn't Sent

The notification system works with a **fallback chain**:

```
Slack (✅ Working) → Telegram (❌ Not configured) → Email (❌ Not configured)
```

**What happens now**: Slack succeeds, so Telegram and Email are never tried.

**To receive emails**, you need to either:
1. Configure email and test it directly (recommended)
2. Break Slack intentionally to trigger the fallback

---

## Step 1: Get Gmail App Password

### For Gmail Users:

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Turn it ON if not already enabled

2. **Generate App Password**:
   - Still in Security settings
   - Find "App passwords" (search for it)
   - Click "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Type "Dubai Nest Hub"
   - Click **Generate**
   - Copy the 16-character password (no spaces)

3. **Save the password** - you'll need it in the next step

### For Other Email Providers:

**Outlook/Office 365**:
```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP**:
- Get SMTP host and port from your email provider
- Use your email and password (or app password)

---

## Step 2: Configure Environment Variables

**Edit**: `truenester-chatbot-api/.env`

Replace these lines with your actual credentials:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>
```

**Example with real values**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=truenester4u@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>
```

**⚠️ Important**: Remove spaces from the app password if you copy-pasted it.

---

## Step 3: Test Email Directly

After adding credentials to `.env`:

```bash
cd truenester-chatbot-api
node test-email-direct.js
```

This will:
1. Check your email configuration
2. Test SMTP connection
3. Send a test email to **info@truenester.com** and **truenester4u@gmail.com**

**Expected output**:
```
✅ SMTP connection successful!
✅ Email sent successfully!
```

**Check both email inboxes** - you should receive the test email.

---

## Step 4: Test the Fallback Chain

### Option A: Test Email in Isolation (Recommended)

Temporarily break Slack to force email fallback:

**Edit `.env`**:
```env
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...  (comment out)
SLACK_WEBHOOK_URL=
```

**Restart backend**:
```bash
npm run dev
```

**Submit contact form** → Email will be sent because Slack is disabled

**Restore Slack** after testing:
```env
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

### Option B: Test All Channels Together

With both Slack and Email configured:

**Submit contact form** → Slack receives notification

**Break Slack temporarily** → Email receives notification

**Fix Slack** → Back to normal

---

## Step 5: Verify in Production

Once emails are working in development:

**For Vercel/Netlify/Heroku**: Add these environment variables in your hosting dashboard:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=truenester4u@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Dubai Nest Hub <noreply@truenester.com>
```

---

## Troubleshooting

### ❌ "Invalid login" Error

**Cause**: Wrong password or 2-Step Verification not enabled

**Fix**:
1. Enable 2-Step Verification first
2. Generate a NEW App Password (don't use regular password)
3. Copy password without spaces
4. Update `.env`

### ❌ "Connection timeout" Error

**Cause**: Firewall blocking port 587

**Fix**:
1. Try port 465 with `EMAIL_SECURE=true`
2. Check firewall/antivirus settings
3. Try from a different network

### ❌ Email sends but doesn't arrive

**Check**:
1. Spam folder
2. Gmail "Sent" folder to confirm it sent
3. Correct email addresses in `notification-service.ts:149`

### ❌ "Username and Password not accepted"

**For Gmail**: You MUST use App Password, not your account password

**For Outlook**: May need to enable "Less secure app access"

---

## Quick Reference

**Test email directly**:
```bash
cd truenester-chatbot-api
node test-email-direct.js
```

**Check health**:
```bash
curl http://localhost:4000/health
```

Should show:
```json
{
  "emailConfigured": true
}
```

**Restart backend after config changes**:
```bash
cd truenester-chatbot-api
npm run dev
```

---

## Next Steps

1. ✅ Add email credentials to `.env`
2. ✅ Run `node test-email-direct.js`
3. ✅ Verify emails arrive at both addresses
4. ✅ Test via contact form
5. ✅ Deploy to production with environment variables

---

**Need help?** Run the test script first - it shows detailed error messages!
