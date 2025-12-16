const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const formData = JSON.parse(event.body);
    const {
      fullName,
      email,
      countryCode,
      phone,
      department,
      subject,
      message,
    } = formData;

    // Validate required fields
    if (!fullName || !email || !phone || !department || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'All fields are required' }),
      };
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
        customer_phone: `${countryCode} ${phone}`,
        customer_email: email,
        start_time: timestamp,
        status: 'new',
        lead_score: 60, // Medium priority for contact form submissions
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

    if (conversationError) throw conversationError;

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

    if (messageError) throw messageError;

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
                  { type: 'mrkdwn', text: `*Phone:*\n${countryCode} ${phone}` },
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
                    url: `${process.env.ADMIN_URL || 'https://your-admin-url.com'}/admin/conversations`,
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message sent successfully!',
        conversationId,
      }),
    };
  } catch (error) {
    console.error('Error processing contact form:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process contact form submission',
        details: error.message,
      }),
    };
  }
};
