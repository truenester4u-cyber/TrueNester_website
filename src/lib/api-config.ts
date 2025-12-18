/**
 * Centralized API Configuration
 * 
 * Automatically detects environment (local vs production) and uses appropriate API URLs.
 * This ensures Slack, Email, and other notifications work correctly in both environments.
 */

// Production backend API URL - UPDATE THIS with your actual Render backend URL
const PRODUCTION_API_URL = "https://truenester-api.onrender.com/api";

// Detect if we're running in production (Vercel, Netlify, etc.)
const isProduction = (): boolean => {
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                        hostname === '127.0.0.1' || 
                        hostname.startsWith('192.168.') ||
                        hostname.startsWith('10.');
    return !isLocalhost;
  }
  // Fallback: check if PROD env var is set
  return import.meta.env.PROD === true;
};

// Clean and normalize URL (remove quotes, trim whitespace, remove trailing slash)
const cleanUrl = (url: string): string => {
  return url.replace(/^["']|["']$/g, '').trim().replace(/\/$/, '');
};

/**
 * Get the Admin/Chatbot API base URL
 * Priority:
 * 1. VITE_CHATBOT_API_URL environment variable
 * 2. VITE_ADMIN_API_URL environment variable
 * 3. Production URL if in production environment
 * 4. Localhost fallback for local development
 */
export const getApiBaseUrl = (): string => {
  const envChatbotUrl = import.meta.env.VITE_CHATBOT_API_URL;
  const envAdminUrl = import.meta.env.VITE_ADMIN_API_URL;
  
  // Use environment variable if set
  if (envChatbotUrl && envChatbotUrl !== 'undefined') {
    const url = cleanUrl(envChatbotUrl);
    console.log(`[API-CONFIG] Using VITE_CHATBOT_API_URL: ${url}`);
    return url;
  }
  
  if (envAdminUrl && envAdminUrl !== 'undefined') {
    const url = cleanUrl(envAdminUrl);
    console.log(`[API-CONFIG] Using VITE_ADMIN_API_URL: ${url}`);
    return url;
  }
  
  // Auto-detect environment
  if (isProduction()) {
    console.log(`[API-CONFIG] Production detected, using: ${PRODUCTION_API_URL}`);
    return PRODUCTION_API_URL;
  }
  
  // Local development fallback
  const localUrl = "http://localhost:4000/api";
  console.log(`[API-CONFIG] Local development, using: ${localUrl}`);
  return localUrl;
};

/**
 * Get the chatbot leads endpoint
 */
export const getChatbotLeadsEndpoint = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/chatbot/leads`;
};

/**
 * Get the contact form endpoint
 */
export const getContactEndpoint = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/contact`;
};

/**
 * Get the property inquiry endpoint
 */
export const getPropertyInquiryEndpoint = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/property-inquiry`;
};

/**
 * Get the sell property endpoint
 */
export const getSellPropertyEndpoint = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/sell-property`;
};

// Export constants for direct use
export const API_BASE_URL = getApiBaseUrl();
export const CHATBOT_LEAD_ENDPOINT = getChatbotLeadsEndpoint();
export const CONTACT_ENDPOINT = getContactEndpoint();
export const PROPERTY_INQUIRY_ENDPOINT = getPropertyInquiryEndpoint();

// Log configuration on module load (helps with debugging)
if (typeof window !== 'undefined') {
  console.log('[API-CONFIG] ================================');
  console.log(`[API-CONFIG] Environment: ${isProduction() ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`[API-CONFIG] API Base URL: ${API_BASE_URL}`);
  console.log(`[API-CONFIG] Chatbot Endpoint: ${CHATBOT_LEAD_ENDPOINT}`);
  console.log('[API-CONFIG] ================================');
}
