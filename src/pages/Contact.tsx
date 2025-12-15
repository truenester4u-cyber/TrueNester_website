import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContactFormData {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  department: string;
  subject: string;
  message: string;
}

const countryCodes = [
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    countryCode: "+971",
    phone: "",
    department: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.department || !formData.subject || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const customerId = crypto.randomUUID();
      const conversationId = crypto.randomUUID();
      const messageId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Create conversation in database
      const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          customer_id: customerId,
          customer_name: formData.fullName,
          customer_phone: `${formData.countryCode} ${formData.phone}`,
          customer_email: formData.email,
          start_time: timestamp,
          status: "new",
          lead_score: 60, // Medium priority for contact form submissions
          lead_quality: "warm",
          intent: formData.department === "sales" ? "buy" : "general",
          tags: [formData.department, "contact-form", "general-inquiry"],
          notes: `Department: ${formData.department}\nSubject: ${formData.subject}`,
          lead_score_breakdown: {
            source: "contact-form",
            department: formData.department,
            hasEmail: true,
            hasPhone: true,
          },
        });

      if (conversationError) throw conversationError;

      // Create the message
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          id: messageId,
          conversation_id: conversationId,
          sender: "customer",
          message_text: `**Subject:** ${formData.subject}\n\n**Message:**\n${formData.message}\n\n---\n**Contact Details:**\n- Name: ${formData.fullName}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- Department: ${formData.department}`,
          message_type: "text",
          timestamp: timestamp,
          is_read: false,
          metadata: {
            source: "contact-form",
            department: formData.department,
            subject: formData.subject,
          },
        });

      if (messageError) throw messageError;

      // Send to Slack webhook via backend (to avoid CORS issues)
      const slackWebhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        try {
          // Use a simple CORS-friendly fetch with mode: 'no-cors'
          const response = await fetch(slackWebhookUrl, {
            method: "POST",
            mode: "no-cors", // Bypass CORS restrictions
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `🔔 New Contact Form Submission`,
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
                    { type: "mrkdwn", text: `*Name:*\n${formData.fullName}` },
                    { type: "mrkdwn", text: `*Department:*\n${formData.department}` },
                    { type: "mrkdwn", text: `*Email:*\n${formData.email}` },
                    { type: "mrkdwn", text: `*Phone:*\n${formData.countryCode} ${formData.phone}` },
                  ],
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Subject:*\n${formData.subject}`,
                  },
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Message:*\n${formData.message}`,
                  },
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "View in Admin Panel",
                        emoji: true,
                      },
                      url: `${window.location.origin}/admin/conversations`,
                      style: "primary",
                    },
                  ],
                },
              ],
            }),
          });
        } catch (slackError) {
          // Don't fail the form submission if Slack fails
        }
      }

      toast({
        title: "Message Sent Successfully! 🎉",
        description: "Thank you for contacting us. Our team will respond within 24 hours.",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        countryCode: "+971",
        phone: "",
        department: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-secondary text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
              Get in Touch
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Have questions? Our team is here to help you find your perfect Dubai property
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-16 bg-background">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Info Cards & Form */}
              <div className="space-y-8">
                {/* Contact Info Cards */}
                <div className="space-y-4">
                  <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Dubai Office</h3>
                        <p className="text-sm text-muted-foreground">
                          206, Bin Sougat building, Salah Al Din street, Deira, Dubai<br />
                          United Arab Emirates
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Phone</h3>
                        <p className="text-sm text-muted-foreground">
                          +971 557 925525<br />
                          +91 97282 98454  (India)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Email</h3>
                        <p className="text-sm text-muted-foreground">
                          info@truenester.com<br />
                          truenester4u@gmail.com
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Working Hours</h3>
                        <p className="text-sm text-muted-foreground">
                          Mon - Fri: 9:00 AM - 6:30 PM<br />
                          Sat: 10:00 AM - 3:00 PM<br />
                          Sun: Closed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>

              {/* Right Column: Form and Map */}
              <div className="space-y-8">
                {/* Contact Form */}
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-6 font-heading">
                      Send us a <span className="text-gradient-primary">Message</span>
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Full Name *</label>
                          <Input 
                            placeholder="Your name" 
                            value={formData.fullName}
                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                            required 
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Email *</label>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required 
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                          <div className="flex gap-2">
                            <Select
                              value={formData.countryCode}
                              onValueChange={(value) => handleInputChange("countryCode", value)}
                              disabled={loading}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <span className="flex items-center gap-2">
                                      <span className="text-lg">{country.flag}</span>
                                      <span>{country.code}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              type="tel" 
                              placeholder="XXXXX XXXXX" 
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              required 
                              disabled={loading}
                              className="flex-1 min-w-0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Department *</label>
                          <Select 
                            value={formData.department}
                            onValueChange={(value) => handleInputChange("department", value)}
                            disabled={loading}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="general">General Inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Subject *</label>
                        <Input 
                          placeholder="How can we help you?" 
                          value={formData.subject}
                          onChange={(e) => handleInputChange("subject", e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Message *</label>
                        <Textarea
                          placeholder="Tell us more about your inquiry..."
                          rows={6}
                          value={formData.message}
                          onChange={(e) => handleInputChange("message", e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-gradient-primary hover:opacity-90 text-white py-6"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Live Map */}
                <div className="rounded-lg overflow-hidden shadow-lg border border-muted h-[400px]">
                  <iframe
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.0838149999997!2d55.26916!3d25.263333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f4b8d9f0c0001%3A0x0!2sBin%20Sougat%20Building!5e0!3m2!1sen!2sae!4v1701356400000"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Terms Links Section */}
        <section className="py-12 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-center">
              <a 
                href="/privacy-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
              >
                Privacy Policy
              </a>
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              <a 
                href="/terms-and-conditions"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Contact;
