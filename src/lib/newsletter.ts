import { NewsletterSubscriptionRequest } from '@/types/newsletter';
import { supabase } from '@/integrations/supabase/client';

// Production backend URL (Render) - fallback to localhost for development
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const PRODUCTION_API_URL = 'https://truenester-api.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || (isProduction ? PRODUCTION_API_URL : 'http://localhost:4001/api');

export const subscribeToNewsletter = async (data: NewsletterSubscriptionRequest) => {
  try {
    console.log('📧 Subscribing to newsletter...');
    
    // Try backend API first (for Slack notifications)
    try {
      const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          source: data.source || 'website',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Newsletter subscription successful via backend API!');
        return { success: true, data: result.data };
      }
      
      // If backend returns error, fall through to Supabase direct
      console.warn('⚠️ Backend API failed, trying direct Supabase...');
    } catch (apiError) {
      console.warn('⚠️ Backend API unavailable, using direct Supabase connection...');
    }

    // Fallback: Direct Supabase insert
    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: data.email,
        source: data.source || 'website',
        ip_address: 'web-client',
        user_agent: navigator.userAgent,
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate email
      if (error.code === '23505') {
        throw new Error('This email is already subscribed to our newsletter.');
      }
      throw new Error(error.message || 'Failed to subscribe');
    }

    console.log('✅ Newsletter subscription successful via Supabase!');
    return { success: true, data: subscriber };
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
    const response = await fetch(`${API_BASE_URL}/newsletter/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to unsubscribe');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to unsubscribe. Please try again.' 
    };
  }
};
