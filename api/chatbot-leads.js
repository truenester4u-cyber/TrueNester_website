/**
 * Vercel Serverless Function - Proxy for chatbot leads API
 * This proxies requests to the backend API
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.VITE_ADMIN_API_URL?.replace('/api', '') || 'https://dubai-nest-hub-api.onrender.com';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-api-key');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Forward request to backend API
    const response = await fetch(`${BACKEND_API_URL}/api/chatbot/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers['x-admin-api-key'] && { 'x-admin-api-key': req.headers['x-admin-api-key'] }),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying chatbot leads request:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to backend API',
      details: error.message,
    });
  }
};



