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
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ValuationFormData = {
  fullName: string;
  email: string;
  phone: string;
  propertyType: string;
  location: string;
  bedrooms: string;
  size: string;
  expectedPrice: string;
  details: string;
};

const Sell = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ValuationFormData>({
    fullName: "",
    email: "",
    phone: "",
    propertyType: "",
    location: "",
    bedrooms: "",
    size: "",
    expectedPrice: "",
    details: "",
  });

  const handleChange = (field: keyof ValuationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.propertyType || !formData.location || !formData.size) {
      toast({
        title: "Missing details",
        description: "Please fill in all required fields marked with *.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const conversationId = crypto.randomUUID();
      const messageId = crypto.randomUUID();
      const customerId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          customer_id: customerId,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          start_time: timestamp,
          status: "new",
          lead_score: 75,
          lead_quality: "hot",
          intent: "sell",
          tags: ["sell", "valuation", "sell-page"],
          notes: `Expected price: ${formData.expectedPrice || "N/A"}`,
          lead_score_breakdown: {
            source: "sell-page",
            hasEmail: Boolean(formData.email),
            hasPhone: Boolean(formData.phone),
            propertyType: formData.propertyType,
          },
        });

      if (conversationError) throw conversationError;

      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          id: messageId,
          conversation_id: conversationId,
          sender: "customer",
          message_text: `*New valuation request*\n\n*Name:* ${formData.fullName}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone}\n*Property Type:* ${formData.propertyType}\n*Location:* ${formData.location}\n*Bedrooms:* ${formData.bedrooms || "N/A"}\n*Size:* ${formData.size} sqft\n*Expected Price:* ${formData.expectedPrice || "N/A"}\n\n*Details:* ${formData.details || "N/A"}`,
          message_type: "text",
          timestamp: timestamp,
          is_read: false,
          metadata: {
            source: "sell-page",
            category: "valuation",
            propertyType: formData.propertyType,
          },
        });

      if (messageError) throw messageError;

      const slackWebhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_QUOTES_URL || import.meta.env.VITE_SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        try {
          await fetch(slackWebhookUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: "🏷️ New valuation request",
              blocks: [
                {
                  type: "header",
                  text: { type: "plain_text", text: "🏷️ New Valuation Request", emoji: true },
                },
                {
                  type: "section",
                  fields: [
                    { type: "mrkdwn", text: `*Name:*\n${formData.fullName}` },
                    { type: "mrkdwn", text: `*Email:*\n${formData.email}` },
                    { type: "mrkdwn", text: `*Phone:*\n${formData.phone}` },
                    { type: "mrkdwn", text: `*Type:*\n${formData.propertyType}` },
                    { type: "mrkdwn", text: `*Location:*\n${formData.location}` },
                    { type: "mrkdwn", text: `*Size:*\n${formData.size} sqft` },
                    { type: "mrkdwn", text: `*Expected Price:*\n${formData.expectedPrice || "N/A"}` },
                  ],
                },
                {
                  type: "section",
                  text: { type: "mrkdwn", text: `*Details:*\n${formData.details || "N/A"}` },
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "Open in Admin", emoji: true },
                      url: `${window.location.origin}/admin/conversations`,
                      style: "primary",
                    },
                  ],
                },
              ],
            }),
          });
        } catch (slackError) {
          // Ignore Slack errors to avoid blocking the user
        }
      }

      toast({
        title: "Request submitted",
        description: "Thank you! Our valuation team will contact you within 24 hours.",
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        propertyType: "",
        location: "",
        bedrooms: "",
        size: "",
        expectedPrice: "",
        details: "",
      });
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Could not send your request. Please try again.",
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
              Sell Your Property with TRUE NESTER
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              List your Dubai property and connect with our network of Indian investors
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                Why Choose <span className="text-gradient-primary">TRUE NESTER</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We provide comprehensive services to ensure your property sells quickly and at the best price
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Maximum Exposure",
                  description: "Reach thousands of Indian investors actively looking for Dubai properties through our extensive network",
                },
                {
                  title: "Expert Valuation",
                  description: "Get accurate property valuation based on current market trends and comparable sales data",
                },
                {
                  title: "Fast Sales",
                  description: "Average sale time of 45 days with 95% price achievement rate through our proven marketing strategies",
                },
              ].map((benefit, index) => (
                <Card key={index} className="text-center border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 duration-300">
                  <CardContent className="p-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Valuation Form */}
        <section className="py-16 bg-background">
          <div className="container-custom max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                Get Free Property <span className="text-gradient-primary">Valuation</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Fill out the form below and our experts will contact you within 24 hours
              </p>
            </div>

            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 md:p-10">
                <form className="space-y-7" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Full Name *</label>
                      <Input 
                        placeholder="Enter your full name" 
                        required 
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        className="h-12 border-gray-300 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Email Address *</label>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        required 
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="h-12 border-gray-300 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Phone Number *</label>
                      <Input 
                        type="tel" 
                        placeholder="+971 XX XXX XXXX" 
                        required 
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="h-12 border-gray-300 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Property Type *</label>
                      <Select value={formData.propertyType} onValueChange={(val) => handleChange("propertyType", val)}>
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-700">Property Location *</label>
                    <Input 
                      placeholder="e.g., Downtown Dubai, Dubai Marina" 
                      required 
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="h-12 border-gray-300 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Bedrooms</label>
                      <Select value={formData.bedrooms} onValueChange={(val) => handleChange("bedrooms", val)}>
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="1">1 Bedroom</SelectItem>
                          <SelectItem value="2">2 Bedrooms</SelectItem>
                          <SelectItem value="3">3 Bedrooms</SelectItem>
                          <SelectItem value="4">4 Bedrooms</SelectItem>
                          <SelectItem value="5+">5+ Bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Size (sqft) *</label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 1500" 
                        required 
                        value={formData.size}
                        onChange={(e) => handleChange("size", e.target.value)}
                        className="h-12 border-gray-300 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-3 text-gray-700">Expected Price (AED)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2,000,000" 
                        value={formData.expectedPrice}
                        onChange={(e) => handleChange("expectedPrice", e.target.value)}
                        className="h-12 border-gray-300 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-700">Additional Details</label>
                    <Textarea
                      placeholder="Tell us more about your property (e.g., amenities, view, parking, etc.)"
                      rows={5}
                      value={formData.details}
                      onChange={(e) => handleChange("details", e.target.value)}
                      className="border-gray-300 focus:border-primary resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Get Free Valuation"
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 mt-4">
                    By submitting this form, you agree to our Terms & Conditions and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-heading">
                How It <span className="text-gradient-primary">Works</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Submit Details",
                  description: "Fill out the valuation form with your property details",
                },
                {
                  step: "2",
                  title: "Expert Review",
                  description: "Our team reviews your property and provides accurate valuation",
                },
                {
                  step: "3",
                  title: "Get Listed",
                  description: "Your property goes live and starts receiving inquiries",
                },
              ].map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-primary">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Sell;
