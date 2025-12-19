/**
 * Vercel Serverless Function - Proxy for admin conversations API
 * This proxies requests to the backend API
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.VITE_ADMIN_API_URL?.replace('/api', '') || 'https://dubai-nest-hub-api.onrender.com';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-api-key');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get conversation ID from URL if present
    const { id } = req.query;
    const endpoint = id 
      ? `${BACKEND_API_URL}/api/admin/conversations/${id}`
      : `${BACKEND_API_URL}/api/admin/conversations${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    // Forward request to backend API
    const response = await fetch(endpoint, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers['x-admin-api-key'] && { 'x-admin-api-key': req.headers['x-admin-api-key'] }),
      },
      ...(req.body && Object.keys(req.body).length > 0 && { body: JSON.stringify(req.body) }),
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying admin conversations request:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to backend API',
      details: error.message,
    });
  }
};



