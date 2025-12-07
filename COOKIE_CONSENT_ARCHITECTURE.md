# Cookie Consent System - Architecture & Flow Diagrams

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Dubai Nest Hub                         │
│                     React + Vite + TypeScript                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌────────────┐  ┌─────────────┐  ┌──────────────┐
        │    App.tsx │  │ CookieBanner│  │AnalyticsLoader
        │   (Root)   │  │  (Component)│  │  (Component) │
        └────────────┘  └─────────────┘  └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │consent.ts   │
                        │ (Utilities) │
                        └─────────────┘
                              │
                        ┌─────▼──────┐
                        │ localStorage│
                        │(Persistence)
                        └──────────────┘
```

---

## 2. User Journey on First Visit

```
┌─────────────────────────────────────────────────────────────────────┐
│ User lands on website for first time                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────┐
                │ CookieBanner checks localStorage   │
                │ for "dubai-nest-hub-consent" key  │
                └────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Key not found?      │
                    │ (No consent yet)    │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  SHOW CONSENT BANNER│
                    │  at bottom of screen│
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ User clicks button: │
                    │  ├─ Accept all      │
                    │  ├─ Essential only  │
                    │  └─ Reject          │
                    └─────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────┐
                │ Save consent to localStorage:      │
                │ {                                  │
                │   level: "all",                    │
                │   timestamp: 1701936000000,        │
                │   version: 1                       │
                │ }                                  │
                └────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  HIDE BANNER        │
                    │                     │
                    └─────────────────────┘
```

---

## 3. Return Visit (Consent Already Stored)

```
┌─────────────────────────────────────────────────────────────────────┐
│ User returns to website                                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────┐
                │ CookieBanner checks localStorage   │
                │ for "dubai-nest-hub-consent"       │
                └────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Key found?          │
                    │ (Consent exists)    │
                    └─────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────┐
                │ Check if expired:                  │
                │ age > 12 months?                   │
                └────────────────────────────────────┘
                              │
                  ┌───────────┴──────────┐
                  │                      │
            NOT EXPIRED            EXPIRED
                  │                      │
                  ▼                      ▼
            ┌──────────┐      ┌──────────────────┐
            │ DON'T    │      │ Clear localStorage│
            │ SHOW     │      │ Show banner again │
            │ BANNER   │      │ (force re-ask)   │
            └──────────┘      └──────────────────┘
```

---

## 4. Analytics Script Loading

```
┌─────────────────────────────────────────────────────────────────────┐
│ AnalyticsLoader component mounts in App                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────┐
                │ Check hasAnalyticsConsent()        │
                │ (user consent level === "all"?)    │
                └────────────────────────────────────┘
                              │
                  ┌───────────┴──────────┐
                  │                      │
            CONSENT = "all"        CONSENT != "all"
                  │                      │
                  ▼                      ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │ Inject analytics     │  │ Do nothing           │
    │ script into <head>:  │  │ (no tracking)        │
    │                      │  └──────────────────────┘
    │ • Google Analytics   │
    │ • Plausible          │
    │ • Umami              │
    │ • Hotjar (etc)       │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Script loads from    │
    │ 3rd party server     │
    │ and starts tracking  │
    │ page views, events   │
    └──────────────────────┘
```

---

## 5. Three Consent Levels Explained

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONSENT LEVEL HIERARCHY                          │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ "all" (Accept All)                                                 │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Essential Cookies                                               │
│    ├─ Form submission data                                        │
│    ├─ Session IDs                                                 │
│    ├─ Chat conversation continuity                               │
│    └─ Security & fraud prevention                                │
│                                                                    │
│ ✅ Analytics Cookies                                               │
│    ├─ Page view tracking                                          │
│    ├─ Event tracking                                              │
│    ├─ User behavior analysis                                      │
│    └─ Performance monitoring                                      │
│                                                                    │
│ Result: Full tracking, all features                               │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ "essential" (Essential Only)                                       │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Essential Cookies                                               │
│    ├─ Form submission data                                        │
│    ├─ Session IDs                                                 │
│    ├─ Chat conversation continuity                               │
│    └─ Security & fraud prevention                                │
│                                                                    │
│ ❌ Analytics Cookies                                               │
│    ├─ Page view tracking          (BLOCKED)                       │
│    ├─ Event tracking              (BLOCKED)                       │
│    ├─ User behavior analysis      (BLOCKED)                       │
│    └─ Performance monitoring      (BLOCKED)                       │
│                                                                    │
│ Result: Privacy-first, all features work                          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ "rejected" (Reject All)                                            │
├────────────────────────────────────────────────────────────────────┤
│ ✅ Essential Cookies (for basic functionality)                    │
│    ├─ Form submission data                                        │
│    ├─ Session IDs (minimal)                                       │
│    ├─ Chat conversation continuity                               │
│    └─ Security & fraud prevention                                │
│                                                                    │
│ ❌ Analytics Cookies                                               │
│    ├─ Page view tracking          (BLOCKED)                       │
│    ├─ Event tracking              (BLOCKED)                       │
│    ├─ User behavior analysis      (BLOCKED)                       │
│    └─ Performance monitoring      (BLOCKED)                       │
│                                                                    │
│ Result: Maximum privacy, essential features still work            │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Storage Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CONSENT EXPIRATION TIMELINE                        │
└─────────────────────────────────────────────────────────────────────┘

TIME ──────────────────────────────────────────────────────────────────▶

Day 0: User visits & clicks "Accept all"
       │
       │ Consent stored:
       │ {
       │   level: "all",
       │   timestamp: 1701936000000,
       │   version: 1
       │ }
       │
       ├─────────────────────────────────────────────────────────────┐
       │                     12 MONTHS                                 │
       ├─────────────────────────────────────────────────────────────┤
       │                                                              │
       Day 365: Consent expires                                       │
               │                                                      │
               │ On next visit:                                      │
               │ 1. isConsentExpired() returns true                  │
               │ 2. localStorage entry is cleared                   │
               │ 3. CookieBanner re-appears                         │
               │ 4. User chooses again                              │
               │                                                      │
               └──── Cycle repeats...                                │
```

---

## 7. Component Integration Map

```
┌──────────────────────────────────────────────────────────────────┐
│                        App.tsx (Root)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ QueryClientProvider                                     │    │
│  │  └─ TooltipProvider                                    │    │
│  │     └─ BrowserRouter                                  │    │
│  │        ├─ AnalyticsLoader (mounts, checks consent)  │    │
│  │        ├─ AppRoutes                                  │    │
│  │        │   └─ <Route paths here...>                │    │
│  │        │      └─ TrueNesterChatbot (not admin)      │    │
│  │        │                                            │    │
│  │        └─ CookieBanner (bottom of page)             │    │
│  │           └─ Shows/hides based on consent           │    │
│  │              └─ Calls setConsent() on click         │    │
│  │                 └─ Updates localStorage             │    │
│  │                    └─ Hides banner                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Shared utilities available everywhere:                         │
│  ├─ getConsentLevel()                                          │
│  ├─ hasAnalyticsConsent()                                      │
│  ├─ hasExplicitConsent()                                       │
│  └─ setConsent()                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. localStorage Structure

```json
{
  "dubai-nest-hub-consent": {
    "level": "all",
    "timestamp": 1701936000000,
    "version": 1
  }
}
```

**Key breakdown:**
- `level`: One of `"all"`, `"essential"`, `"rejected"`
- `timestamp`: When consent was given (milliseconds since epoch)
- `version`: Consent policy version (increment if terms change)

**Checking expiration:**
```
age = Date.now() - timestamp
isExpired = age > (12 * 30 * 24 * 60 * 60 * 1000)  // 12 months
```

---

## 9. Consent Flow Summary

```
                     User Interaction
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          "Accept all" "Essential" "Reject"
              │            │            │
              └────────────┼────────────┘
                           │
                           ▼
                  setConsent(level)
                           │
                           ▼
                 Save to localStorage
                           │
                           ▼
            Update CookieBanner visibility
                           │
                           ▼
         AnalyticsLoader checks consent
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     Load analytics scripts        Do nothing
              │                         │
              └────────────┬────────────┘
                           │
                      Persistence
                    (across sessions)
```

---

## 10. Essential vs Analytics - Decision Tree

```
Feature/Cookie: Should it require consent?

   ┌─ Is it NECESSARY for basic site functionality?
   │  (forms, chat, auth, security)
   │
   YES ──────────► ESSENTIAL ─────► No consent required
   │
   NO
   │
   ├─ Does it track user behavior, pages, or identify returning users?
   │  (analytics, advertising, heatmaps, session recording)
   │
   YES ──────────► ANALYTICS ─────► Requires "all" consent
   │
   NO
   │
   └─ Default ──────► ESSENTIAL ───► Safe to assume necessary
```

---

This visual guide helps you understand how the cookie consent system works at every level!
