import { NewsletterSubscriptionRequest } from '@/types/newsletter';
import { API_BASE_URL } from '@/lib/api-config';

const getNewsletterApiCandidates = (): string[] => {
  const candidates = [API_BASE_URL];

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    candidates.push('http://localhost:4000/api');
    candidates.push('http://localhost:4001/api');
  }

  return [...new Set(candidates.map((url) => url.replace(/\/$/, '')))];
};

const postNewsletterRequest = async (path: string, payload: Record<string, string>) => {
  const candidates = getNewsletterApiCandidates();
  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed. Please try again.');
      }

      return result;
    } catch (error: any) {
      const isNetworkError = error instanceof TypeError;
      if (!isNetworkError) {
        throw (error instanceof Error ? error : new Error('Request failed. Please try again.'));
      }

      lastError = error instanceof Error ? error : new Error('Failed to fetch');
    }
  }

  throw lastError || new Error('Failed to fetch');
};

export const subscribeToNewsletter = async (data: NewsletterSubscriptionRequest) => {
  try {
    console.log('📧 Subscribing to newsletter...');

    const result = await postNewsletterRequest('/newsletter/subscribe', {
      email: data.email,
      source: data.source || 'website',
    });

    console.log('✅ Newsletter subscription successful via backend API!');
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('❌ Newsletter subscription error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to subscribe. Please try again.' 
    };
  }
};

export const unsubscribeFromNewsletter = async (email: string) => {
  try {
    await postNewsletterRequest('/newsletter/unsubscribe', { email });

    return { success: true };
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to unsubscribe. Please try again.' 
    };
  }
};
