const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

module.exports = async (req, res) => {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if Supabase is configured
  if (!supabase) {
    console.error('Supabase client not initialized - missing environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Supabase credentials not configured',
    });
  }

  try {
    // Parse request body (Vercel might auto-parse, but handle both cases)
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const {
      fullName,
      email,
      countryCode,
      phone,
      department,
      subject,
      message,
    } = body || {};

    // Validate required fields
    if (!fullName || !email || !phone || !department || !subject || !message) {
      return res.status(400).json({ 
        error: 'All fields are required',
        received: { fullName, email, phone, department, subject, message: !!message }
      });
    }

    const customerId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Create conversation in database
    const { error: conversationError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        customer_id: customerId,
        customer_name: fullName,
        customer_phone: `${countryCode || '+971'} ${phone}`,
        customer_email: email,
        start_time: timestamp,
        status: 'new',
        lead_score: 60,
        lead_quality: 'warm',
        intent: department === 'sales' ? 'buy' : 'general',
        tags: [department, 'contact-form', 'general-inquiry'],
        notes: `Department: ${department}\nSubject: ${subject}`,
        lead_score_breakdown: {
          source: 'contact-form',
          department: department,
          hasEmail: true,
          hasPhone: true,
        },
      });

    if (conversationError) {
      console.error('Conversation insert error:', conversationError);
      throw conversationError;
    }

    // Create the message
    const { error: messageError } = await supabase.from('chat_messages').insert({
      id: messageId,
      conversation_id: conversationId,
      sender: 'customer',
      message_text: `**Subject:** ${subject}\n\n**Message:**\n${message}\n\n---\n**Contact Details:**\n- Name: ${fullName}\n- Email: ${email}\n- Phone: ${phone}\n- Department: ${department}`,
      message_type: 'text',
      timestamp: timestamp,
      is_read: false,
      metadata: {
        source: 'contact-form',
        department: department,
        subject: subject,
      },
    });

    if (messageError) {
      console.error('Message insert error:', messageError);
      throw messageError;
    }

    // Send to Slack if webhook URL is configured
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      try {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔔 New Contact Form Submission`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '📬 New Contact Form Message',
                  emoji: true,
                },
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Name:*\n${fullName}` },
                  { type: 'mrkdwn', text: `*Department:*\n${department}` },
                  { type: 'mrkdwn', text: `*Email:*\n${email}` },
                  { type: 'mrkdwn', text: `*Phone:*\n${countryCode || '+971'} ${phone}` },
                ],
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Subject:*\n${subject}`,
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Message:*\n${message}`,
                },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View in Admin Panel',
                      emoji: true,
                    },
                    url: `${process.env.ADMIN_URL || process.env.VITE_SUPABASE_URL || 'https://dubai-nest-hub-f3c99d5902f9f02eb444.vercel.app'}/admin/conversations`,
                    style: 'primary',
                  },
                ],
              },
            ],
          }),
        });
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
        // Don't fail the request if Slack notification fails
      }
    }

    return res.status(200).json({
      message: 'Message sent successfully!',
      conversationId,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({
      error: 'Failed to process contact form submission',
      details: error.message || 'Unknown error occurred',
    });
  }
};
