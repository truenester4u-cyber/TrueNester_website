// Supabase Edge Function to send email notifications for new inquiries
// Deploy with: supabase functions deploy send-inquiry-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyTitle: string;
  propertyUrl: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: InquiryPayload = await req.json();
    
    const { customerName, customerEmail, customerPhone, propertyTitle, propertyUrl, message } = payload;

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #0D9488; }
          .value { margin-top: 5px; }
          .property-link { background: #0D9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          .footer { background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏠 New Property Inquiry</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">True Nester - Dubai Real Estate</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Property:</div>
              <div class="value">${propertyTitle}</div>
            </div>
            <div class="field">
              <div class="label">Customer Name:</div>
              <div class="value">${customerName}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></div>
            </div>
            <div class="field">
              <div class="label">Phone:</div>
              <div class="value"><a href="tel:${customerPhone}">${customerPhone}</a></div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="value">${message || 'No message provided'}</div>
            </div>
            <a href="${propertyUrl}" class="property-link">View Property →</a>
          </div>
          <div class="footer">
            This inquiry was submitted via True Nester website.<br>
            Please respond within 24 hours for best conversion rates.
          </div>
        </div>
      </body>
      </html>
    `;

    // Check if API key exists
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service not configured");
    }

    console.log("Sending email with Resend API...");
    console.log("To: truenester4u@gmail.com, info@truenester.com");
    
    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "True Nester <onboarding@resend.dev>",
        to: ["truenester4u@gmail.com", "info@truenester.com"],
        subject: `🏠 New Inquiry: ${propertyTitle} - ${customerName}`,
        html: emailHtml,
        reply_to: customerEmail,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Resend API response:", JSON.stringify(emailResult));

    if (!emailResponse.ok) {
      console.error("Email send failed:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully!");
    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", result: emailResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in send-inquiry-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
