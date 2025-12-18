interface EmailNotificationPayload {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  source: "contact_form" | "property_inquiry";
  subject?: string;
  message?: string;
  department?: string;
  propertyTitle?: string;
  propertyUrl?: string;
}

export const sendMultiChannelNotification = async (
  payload: EmailNotificationPayload
): Promise<{ success: boolean }> => {
  const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:4000/api";
  
  const endpoint = payload.source === "contact_form" ? "/contact" : "/property-inquiry";
  const apiUrl = adminApiUrl.endsWith('/api') ? adminApiUrl : `${adminApiUrl}/api`;
  const fullUrl = `${apiUrl}${endpoint}`;

  try {
    console.log(`[NOTIFICATION] Sending to backend API: ${fullUrl}`);
    
    const backendPayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      subject: payload.subject,
      message: payload.message,
      department: payload.department,
      propertyTitle: payload.propertyTitle,
      propertyUrl: payload.propertyUrl,
    };

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });

    if (response.ok) {
      console.log("[NOTIFICATION] Backend notification sent successfully (Slack + Telegram + Email)");
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error("[NOTIFICATION] Backend notification failed:", response.status, errorText);
    }
  } catch (error) {
    console.error("[NOTIFICATION] Backend notification error:", error);
  }

  return { success: false };
};

const buildSlackMessage = (payload: EmailNotificationPayload): any => {
  const adminUrl = window.location.origin + "/admin/conversations";

  if (payload.source === "contact_form") {
    return {
      text: `📬 New Contact Form: ${payload.customerName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📬 New Contact Form Message",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Name:*\n${payload.customerName}` },
            { type: "mrkdwn", text: `*Department:*\n${payload.department || "N/A"}` },
            { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
            { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Subject:* ${payload.subject}\n\n*Message:*\n${payload.message}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View in Admin Panel" },
              url: adminUrl,
              style: "primary",
            },
          ],
        },
      ],
    };
  }

  if (payload.source === "property_inquiry") {
    return {
      text: `🏠 New Property Inquiry: ${payload.customerName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🏠 New Property Inquiry",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Name:*\n${payload.customerName}` },
            { type: "mrkdwn", text: `*Property:*\n${payload.propertyTitle || "N/A"}` },
            { type: "mrkdwn", text: `*Email:*\n${payload.customerEmail || "N/A"}` },
            { type: "mrkdwn", text: `*Phone:*\n${payload.customerPhone || "N/A"}` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${payload.message || "No message provided"}`,
          },
        },
        {
          type: "actions",
          elements: [
            ...(payload.propertyUrl
              ? [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "View Property" },
                    url: payload.propertyUrl,
                  },
                ]
              : []),
            {
              type: "button",
              text: { type: "plain_text", text: "View in Admin" },
              url: adminUrl,
              style: "primary",
            },
          ],
        },
      ],
    };
  }

  return { text: `New notification from ${payload.customerName}` };
};
