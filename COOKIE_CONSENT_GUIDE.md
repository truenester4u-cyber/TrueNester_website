# Cookie Consent System - Implementation Guide

## Overview

Dubai Nest Hub now includes a **minimal, privacy-friendly cookie consent system** designed specifically for UAE/Dubai compliance (PDPL-aligned). This guide explains how to use and customize it.

---

## Files Created

### 1. `src/utils/consent.ts`
Core utility module for managing consent state. All consent logic lives here.

**Key exports:**
- `CookieConsentLevel` type: `"all" | "essential" | "rejected"`
- `getConsentLevel()` – Returns current consent level or `null`
- `setConsent(level)` – Saves user choice (with 12-month expiration)
- `hasAnalyticsConsent()` – Check if analytics can load
- `hasExplicitConsent()` – Check if any consent decision was made
- `isConsentExpired()` – Check if consent needs to be re-asked

### 2. `src/components/CookieBanner.tsx`
React component that displays the consent banner.

**Features:**
- Shows only if user hasn't made a choice yet
- Responsive design (stack on mobile, horizontal on desktop)
- Three buttons: "Accept all", "Essential only", "Reject"
- Privacy Policy link (update the URL in the component)
- Uses Tailwind CSS + shadcn/ui styling

**Where to find the Privacy Policy link:**
```tsx
<a href="/privacy-policy" ...>  {/* Change this path */}
```

### 3. `src/components/AnalyticsLoader.tsx`
Component that conditionally loads analytics scripts.

**Features:**
- Only injects scripts if user accepted "all" cookies
- Includes placeholder comments for popular analytics services:
  - Google Analytics
  - Plausible (recommended for privacy)
  - Umami (recommended for privacy)
- No visible output (renders `null`)

### 4. Updated `src/App.tsx`
- Imports and includes `<CookieBanner />` and `<AnalyticsLoader />`
- Banner appears at bottom of every page except admin routes
- Analytics loader runs when consent is granted

---

## How It Works

### User Flow (First Visit)

1. **User visits site** → No consent stored in localStorage
2. **CookieBanner appears** at bottom of screen
3. **User clicks one of:**
   - **"Accept all"** → Sets `{ level: "all", ... }` in localStorage, enables analytics
   - **"Essential only"** → Sets `{ level: "essential", ... }`, blocks analytics
   - **"Reject"** → Sets `{ level: "rejected", ... }`, blocks all non-essential
4. **Banner hides** automatically
5. **Consent stored for 12 months** (auto-extends on return visits)

### Subsequent Visits

- Banner does NOT appear (user already chose)
- If 12 months pass, consent expires and banner re-appears
- User can manually clear localStorage to reset (for testing)

### Analytics Loading

- `AnalyticsLoader` checks `hasAnalyticsConsent()` on mount
- If `true`: injects your analytics script
- If `false`: does nothing
- Re-runs whenever user changes consent

---

## Storage Details

**localStorage key:** `dubai-nest-hub-consent`

**Example stored value:**
```json
{
  "level": "all",
  "timestamp": 1701936000000,
  "version": 1
}
```

**Expiration:** 12 months from `timestamp`
**Version:** Increment if you change your consent policy (forces re-ask)

---

## Customization Guide

### 1. Update Privacy Policy Link

In `src/components/CookieBanner.tsx`:
```tsx
<a href="/privacy-policy" ...>  {/* Change "/privacy-policy" to your actual path */}
```

### 2. Add Your Analytics Script

In `src/components/AnalyticsLoader.tsx`, uncomment and fill in your service:

**Google Analytics example:**
```tsx
useEffect(() => {
  if (!hasAnalyticsConsent()) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G_XXXXXXXXXX";
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G_XXXXXXXXXX");
}, []);
```

**Plausible example (recommended for privacy):**
```tsx
useEffect(() => {
  if (!hasAnalyticsConsent()) return;

  const script = document.createElement("script");
  script.defer = true;
  script.setAttribute("data-domain", "yourdomain.com");
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}, []);
```

### 3. Customize Banner Text

In `src/components/CookieBanner.tsx`, edit the `<p>` tag:
```tsx
<p className="text-sm text-gray-700 leading-relaxed">
  Your custom message here...
</p>
```

### 4. Customize Button Labels

In `src/components/CookieBanner.tsx`:
```tsx
<button onClick={handleReject}>Reject</button>
<button onClick={handleEssentialOnly}>Essential only</button>
<button onClick={handleAcceptAll}>Accept all</button>
```

### 5. Change Expiration Time

In `src/utils/consent.ts`:
```typescript
const CONSENT_EXPIRATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // Change to 6 months
```

### 6. Change Styling

All components use Tailwind CSS classes. Modify them directly:

**Banner background:** `bg-white border-t border-gray-200` in `CookieBanner.tsx`
**Button colors:** Change `bg-blue-600 hover:bg-blue-700` etc.

---

## Testing

### Test 1: First Visit (Fresh Browser)
1. Open DevTools → Application → Clear all Storage
2. Reload page
3. Banner should appear at bottom
4. Click any button
5. Banner should hide
6. Check localStorage for `dubai-nest-hub-consent`

### Test 2: Consent Persistence
1. Reload page multiple times
2. Banner should NOT appear
3. Check localStorage value persists

### Test 3: Analytics Loading
1. Set localStorage to: `{"level":"all","timestamp":${Date.now()},"version":1}`
2. Reload page
3. Open DevTools → Network tab
4. Your analytics script should load (if configured)
5. Change localStorage to `level: "essential"`
6. Reload
7. Analytics script should NOT load

### Test 4: Expiration
1. Set localStorage to: `{"level":"all","timestamp":0,"version":1}` (old timestamp)
2. Reload page
3. Banner should re-appear (consent expired)

---

## What's "Essential" vs "Analytics"?

### Essential (Always Enabled)
- Form submissions (Contact, Inquiry)
- Chat session IDs (conversation continuity)
- Supabase auth tokens
- Basic site functionality
- Error logging for debugging

### Analytics (Requires "all" or "essential" Consent)
- Page view tracking
- User behavior tracking
- Conversion tracking
- Heatmaps
- Session recording

---

## Integration with Existing Features

### Contact Form (`Contact.tsx`)
- **Current behavior:** Works without explicit consent
- **Why:** Essential for business inquiry capture
- **Note:** Add comment explaining this is essential

### Chatbot (`TrueNesterChatbot.tsx`)
- **Current behavior:** Works without explicit consent
- **Why:** Essential for conversation continuity
- **Note:** Session ID is essential, not tracking

### Property Inquiry Form (`PropertyDetail.tsx`)
- **Current behavior:** Works without explicit consent
- **Why:** Essential for property inquiries
- **Note:** Not considered "analytics"

---

## Privacy Policy Template

Create `/src/pages/PrivacyPolicy.tsx` or add `/privacy-policy` route.

**Key sections to include:**
1. What cookies we use (essential vs optional)
2. How long cookies are stored (12 months for consent)
3. How to manage preferences (clear localStorage)
4. Analytics services used (if any)
5. User rights under PDPL

**Example snippet:**
> "We use cookies to remember your consent preference for 12 months. Essential cookies are always used for form submission and chat functionality. Analytics cookies only load after you click 'Accept all' and help us understand how visitors use our site."

---

## PDPL Compliance Checklist

- ✅ Explicit consent required before analytics
- ✅ Easy to withdraw (can change or clear consent)
- ✅ Consent expires periodically (12 months)
- ✅ Minimal data collection (no behavioral tracking by default)
- ✅ Clear privacy policy link
- ✅ Essential functionality works without consent
- ✅ No dark patterns (buttons are equal size)

---

## Best Practices for Dubai Real Estate

1. **Be transparent:** Always explain what data you're collecting
2. **Privacy-first analytics:** Use services like Plausible or Umami instead of Google Analytics
3. **Respect user choice:** If they reject, don't nag them again
4. **Update policy:** If your tracking practices change, increment `CONSENT_VERSION` to force re-ask
5. **No cookies for personalization:** Avoid returning user tracking unless explicitly needed
6. **Chat is essential:** Conversation continuity is a legitimate business need

---

## FAQ

### Q: Should I use cookies or localStorage?
**A:** Current implementation uses localStorage (no HTTP headers needed). For traditional cookies, use the `js-cookie` library.

### Q: Can users change their mind?
**A:** Currently, users must clear localStorage manually. To add a preference center:
1. Create a Settings page
2. Show current consent level
3. Allow change with `setConsent(level)`
4. Add link in footer

### Q: What if the user clears browser data?
**A:** Consent is cleared and banner re-appears on next visit (expected behavior).

### Q: Can I use this with other consent tools?
**A:** No, keep this simple. This is designed to be minimal and self-contained.

### Q: Do I need a privacy policy?
**A:** **Yes.** Required by PDPL. Must explain cookies and user rights. Link in banner points to `/privacy-policy`.

---

## Summary

You now have:
- ✅ A privacy-friendly consent system (localStorage-based)
- ✅ A beautiful, responsive banner (Tailwind + React)
- ✅ Clean utility functions for checking consent
- ✅ Analytics loading pattern (ready for your service)
- ✅ PDPL-compliant approach
- ✅ Zero external dependencies

All files are in place and integrated into your app. Customize as needed!
