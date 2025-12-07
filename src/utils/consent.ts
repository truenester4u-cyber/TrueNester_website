/**
 * Privacy-friendly cookie consent utility for Dubai Nest Hub
 * 
 * This module manages user consent for non-essential cookies and analytics.
 * - Essential cookies (session IDs, form data, basic functionality) are always used.
 * - Analytics and optional tracking only activates after explicit "Accept all" consent.
 * - Compliant with UAE Privacy Protection Law (PDPL) minimal consent approach.
 */

export type CookieConsentLevel = "all" | "essential" | "rejected";

interface ConsentData {
  level: CookieConsentLevel;
  timestamp: number;
  version: number; // Increment if consent policy changes
}

// Consent storage key in localStorage
const CONSENT_STORAGE_KEY = "dubai-nest-hub-consent";
const CONSENT_VERSION = 1;

// Expiration time in milliseconds (12 months)
const CONSENT_EXPIRATION_MS = 12 * 30 * 24 * 60 * 60 * 1000;

/**
 * Check if the consent preference has expired.
 * @returns true if consent has expired or never set
 */
export function isConsentExpired(): boolean {
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!stored) return true;

  try {
    const data: ConsentData = JSON.parse(stored);
    const age = Date.now() - data.timestamp;
    return age > CONSENT_EXPIRATION_MS;
  } catch {
    return true;
  }
}

/**
 * Get the current consent level.
 * @returns "all" | "essential" | "rejected" | null (if not set)
 */
export function getConsentLevel(): CookieConsentLevel | null {
  // Return null if consent has expired (force re-ask)
  if (isConsentExpired()) {
    clearConsent();
    return null;
  }

  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: ConsentData = JSON.parse(stored);
    // Invalidate if version mismatch (consent policy changed)
    if (data.version !== CONSENT_VERSION) {
      clearConsent();
      return null;
    }
    return data.level;
  } catch {
    return null;
  }
}

/**
 * Save a user's consent choice.
 * @param level - "all", "essential", or "rejected"
 */
export function setConsent(level: CookieConsentLevel): void {
  const data: ConsentData = {
    level,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Clear the stored consent (used internally when expired or policy changes).
 */
export function clearConsent(): void {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

/**
 * Check if user has consented to analytics/optional cookies.
 * This is used to conditionally load analytics scripts.
 * @returns true if consent level is "all"
 */
export function hasAnalyticsConsent(): boolean {
  const level = getConsentLevel();
  return level === "all";
}

/**
 * Check if user has any explicit consent (accepts either "all" or "essential").
 * Useful for determining if banner should be shown.
 * @returns true if consent level is set (not null)
 */
export function hasExplicitConsent(): boolean {
  return getConsentLevel() !== null;
}

/**
 * Check if user explicitly rejected all non-essential cookies.
 * @returns true if consent level is "rejected"
 */
export function isConsentRejected(): boolean {
  return getConsentLevel() === "rejected";
}

/**
 * Get detailed consent status (useful for debugging or transparency).
 */
export function getConsentStatus() {
  return {
    level: getConsentLevel(),
    hasAnalytics: hasAnalyticsConsent(),
    isExpired: isConsentExpired(),
    hasExplicit: hasExplicitConsent(),
    timestamp: (() => {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) return null;
      try {
        return new Date((JSON.parse(stored) as ConsentData).timestamp);
      } catch {
        return null;
      }
    })(),
  };
}
