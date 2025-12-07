/**
 * CookieBanner.tsx
 * 
 * Minimal, responsive cookie consent banner for Dubai Nest Hub.
 * Appears at the bottom of the screen when user has not yet consented.
 * Compliant with UAE PDPL guidelines for privacy-friendly consent.
 */

import React, { useState, useEffect } from "react";
import { setConsent, hasExplicitConsent, getConsentLevel } from "@/utils/consent";

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't made a consent choice yet
    if (!hasExplicitConsent()) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    setConsent("all");
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    setConsent("essential");
    setVisible(false);
  };

  const handleReject = () => {
    setConsent("rejected");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Banner text */}
          <div className="flex-1 pr-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              We use cookies and similar technologies to improve your experience and analyze site traffic. By continuing, you agree to our use of cookies.{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Reject
            </button>

            <button
              onClick={handleEssentialOnly}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Essential only
            </button>

            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
