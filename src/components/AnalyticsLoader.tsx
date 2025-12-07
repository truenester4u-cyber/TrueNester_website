/**
 * AnalyticsLoader.tsx
 * 
 * Conditionally loads analytics scripts only after user has consented to "all" cookies.
 * This is a privacy-first approach that respects user choice.
 * 
 * Usage:
 * 1. Place <AnalyticsLoader /> in your root layout or App component.
 * 2. Uncomment and fill in your analytics script below.
 * 3. The component will automatically inject the script when user accepts all cookies.
 */

import React, { useEffect } from "react";
import { hasAnalyticsConsent } from "@/utils/consent";

export const AnalyticsLoader: React.FC = () => {
  useEffect(() => {
    // Only load analytics if user has explicitly consented
    if (!hasAnalyticsConsent()) {
      return;
    }

    // ========================================================================
    // PLACEHOLDER: Insert your analytics script(s) here
    // ========================================================================
    // Example: Google Analytics
    // --------
    // const script = document.createElement("script");
    // script.async = true;
    // script.src = "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID";
    // document.head.appendChild(script);
    //
    // window.dataLayer = window.dataLayer || [];
    // function gtag() {
    //   window.dataLayer.push(arguments);
    // }
    // gtag("js", new Date());
    // gtag("config", "GA_MEASUREMENT_ID");

    // --------
    // Example: Plausible Analytics (privacy-friendly alternative)
    // --------
    // const script = document.createElement("script");
    // script.defer = true;
    // script.setAttribute("data-domain", "yourdomain.com");
    // script.src = "https://plausible.io/js/script.js";
    // document.head.appendChild(script);

    // --------
    // Example: Umami Analytics (self-hosted, privacy-friendly)
    // --------
    // const script = document.createElement("script");
    // script.async = true;
    // script.src = "https://your-umami-instance.com/script.js";
    // script.setAttribute("data-website-id", "your-website-id");
    // document.head.appendChild(script);

    // ========================================================================
    // Add your analytics script injection above this line
    // ========================================================================
  }, []);

  return null; // This component doesn't render anything visible
};

/**
 * INTEGRATION NOTES:
 * 
 * 1. **Where to use this component**:
 *    - Add <AnalyticsLoader /> in your root layout (App.tsx) or main.tsx
 *    - It should be wrapped inside the main app tree, not in a separate context
 *
 * 2. **What counts as "analytics"**:
 *    - Google Analytics
 *    - Plausible
 *    - Umami
 *    - Hotjar (heatmaps)
 *    - Segment
 *    - Mixpanel
 *    - Any script that tracks user behavior across sessions
 *
 * 3. **What does NOT need this component**:
 *    - Session IDs for form submissions (essential)
 *    - Supabase auth tokens (essential)
 *    - Chat session tracking (essential, needed for conversation continuity)
 *    - Error logging for debugging (essential for site health)
 *
 * 4. **Privacy-friendly alternatives**:
 *    For a Dubai-based real estate website, consider privacy-first analytics:
 *    - Plausible: https://plausible.io (no cookies, GDPR/PDPL compliant)
 *    - Umami: https://umami.is (lightweight, self-hosted option)
 *    - Fathom: https://usefathom.com (cookie-free analytics)
 *
 * 5. **Testing**:
 *    - Open DevTools > Application > LocalStorage
 *    - Look for "dubai-nest-hub-consent"
 *    - Set to { "level": "all", "timestamp": ..., "version": 1 }
 *    - Reload page
 *    - Your analytics script should load
 *    - Then set to { "level": "essential", ... } and reload
 *    - Script should NOT load
 */
