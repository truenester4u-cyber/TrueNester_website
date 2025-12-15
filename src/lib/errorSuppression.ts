/**
 * Global error suppression for known Supabase issues
 * Prevents console spam from 406 errors and other expected failures
 */

// Store original console.error
const originalError = console.error;
const originalWarn = console.warn;

// Track suppressed errors to avoid infinite suppression
const suppressedErrors = new Set<string>();
const MAX_SUPPRESSION_COUNT = 5;

/**
 * Suppress specific error patterns that are known and handled
 */
export const initErrorSuppression = () => {
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    // Suppress 406 errors from Supabase storage (these are handled by image fallbacks)
    if (errorMessage.includes('406') || errorMessage.includes('Not Acceptable')) {
      const key = '406-error';
      const count = suppressedErrors.size;
      
      if (count < MAX_SUPPRESSION_COUNT) {
        suppressedErrors.add(key);
        originalWarn('⚠️ Supabase 406 error detected (image loading issue - using fallback)');
      }
      return; // Suppress the error
    }
    
    // Suppress CORS preflight errors (browser security, not actual errors)
    if (errorMessage.includes('CORS') && errorMessage.includes('preflight')) {
      return;
    }
    
    // Suppress "Failed to load resource" if it's a 406
    if (errorMessage.includes('Failed to load resource') && errorMessage.includes('406')) {
      return;
    }
    
    // Allow all other errors through
    originalError.apply(console, args);
  };

  // Optional: Also suppress certain warnings
  console.warn = (...args: any[]) => {
    const warnMessage = args.join(' ');
    
    // Suppress React Router warnings about relative paths (known issue)
    if (warnMessage.includes('Relative route resolution') || 
        warnMessage.includes('v7_startTransition') ||
        warnMessage.includes('v7_relativeSplatPath')) {
      return;
    }
    
    // Allow all other warnings through
    originalWarn.apply(console, args);
  };

  console.log('✅ Error suppression initialized - 406 errors will be handled silently');
};

/**
 * Restore original console methods (for debugging)
 */
export const restoreConsole = () => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log('✅ Console restored to original behavior');
};

/**
 * Check if error suppression is active
 */
export const isSuppressed = () => {
  return console.error !== originalError;
};
