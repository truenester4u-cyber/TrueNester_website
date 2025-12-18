import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { fetchRentalProperties, insertConversation, insertChatMessages, queryProperties } from "@/lib/supabase-queries";
import { getSignedImageUrl } from "@/lib/image-utils";
import { getChatbotLeadsEndpoint } from "@/lib/api-config";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  isoTimestamp: string;
  cards?: PropertyCard[];
  ctas?: CTAButton[];
  offers?: OfferBanner[];
  tone?: "info" | "success" | "warning" | "promo";
}

type IntentType = "buy" | "rent" | "invest" | "browse";

type CTAAction =
  | "schedule-tour"
  | "send-email"
  | "connect-agent"
  | "view-details"
  | "save-property"
  | "request-finance"
  | "get-brochure";

interface CTAButton {
  id: string;
  label: string;
  action: CTAAction;
  payload?: Record<string, string>;
}

interface PropertyCard {
  id: string;
  title: string;
  area: string;
  priceDisplay: string;
  priceValue: number;
  bedrooms: string;
  baths: string;
  size: string;
  type: "apartment" | "villa" | "townhouse" | "penthouse";
  tenure: "buy" | "rent" | "invest";
  image: string;
  badges: string[];
  highlights: string[];
  availability?: string;
  incentives?: string;
}

interface OfferBanner {
  id: string;
  title: string;
  description: string;
  urgency?: string;
  cta?: CTAButton;
}

interface LeadScore {
  tier: "hot" | "warm" | "cold";
  value: number;
  reasoning: string;
}

type LeadInfo = {
  name: string;
  phone: string;
  email?: string;
  budget: string;
  locations: string[];
};

type QuickAction = {
  id: string;
  label: string;
  description: string;
  variant: "primary" | "secondary";
  flowId?: string;
  fallbackMessage?: string;
};

type FlowOption = {
  label: string;
  response?: string;
  nextStepId?: string;
  startLeadCapture?: boolean;
};

type FlowStep = {
  id: string;
  prompt: string;
  options: FlowOption[];
  nextStepId?: string;
};

type FlowDefinition = {
  id: string;
  steps: FlowStep[];
};

const brand = {
  green: "#219F68",
  blue: "#1D74B8",
};

const proactivePopupSessionKey = "tnr_proactive_popup_count";
const MAX_POPUP_SHOWS = 3;

const createId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

// Use centralized API config for production/development auto-detection
const CHATBOT_LEAD_ENDPOINT = getChatbotLeadsEndpoint();

const communityInsights = [
  {
    name: "Business Bay",
    minBudget: 900000,
    summary: "Central location near Downtown, high rental demand, premium canal views.",
    propertyTypes: "1-3BR apartments, branded residences",
    developers: "Dubai Properties, Damac, Omniyat",
    averageYield: "6.5%",
  },
  {
    name: "Dubai Marina",
    minBudget: 1200000,
    summary: "Waterfront lifestyle, vibrant promenade, strong resale liquidity.",
    propertyTypes: "Apartments, penthouses",
    developers: "Emaar, Select Group",
    averageYield: "6%",
  },
  {
    name: "Dubai Hills Estate",
    minBudget: 1100000,
    summary: "Family-focused master community with schools, park, golf course.",
    propertyTypes: "Townhouses, villas, mid-rise apartments",
    developers: "Emaar, Meraas",
    averageYield: "5.5%",
  },
  {
    name: "Jumeirah Village Circle",
    shortName: "JVC",
    minBudget: 650000,
    summary: "Value segment with steady rental yields and ongoing supply.",
    propertyTypes: "Studios to 3BR apartments, townhouses",
    developers: "Ellington, Binghatti, Samana",
    averageYield: "7%",
  },
  {
    name: "Downtown Dubai",
    minBudget: 1500000,
    summary: "Flagship luxury district anchored by Burj Khalifa and Dubai Mall.",
    propertyTypes: "Luxury apartments, penthouses",
    developers: "Emaar, Omniyat",
    averageYield: "5%",
  },
  {
    name: "Arabian Ranches",
    minBudget: 1800000,
    summary: "Established villa enclave with mature landscaping and schools.",
    propertyTypes: "3-6BR villas",
    developers: "Emaar",
    averageYield: "4.8%",
  },
  {
    name: "Palm Jumeirah",
    minBudget: 2200000,
    summary: "Iconic island living, beach access, branded residences.",
    propertyTypes: "Villas, penthouses, branded apartments",
    developers: "Nakheel, Kerzner",
    averageYield: "5.2%",
  },
  {
    name: "Ras Al Khaimah",
    minBudget: 900000,
    summary: "Upcoming Wynn Resort, freehold islands, attractive entry pricing.",
    propertyTypes: "Waterfront apartments, villas",
    developers: "Marjan, Emaar",
    averageYield: "6.8%",
  },
  {
    name: "Heart of Europe",
    minBudget: 2500000,
    summary: "Ultra-luxury island clusters with hospitality-managed residences.",
    propertyTypes: "Holiday homes, branded suites",
    developers: "Kleindienst",
    averageYield: "Project-based, rental pools",
  },
];

const cityHighlights: Record<string, string> = {
  dubai:
    "Dubai offers diversified communities from downtown luxury to suburban villas, with mature infrastructure and consistent international demand.",
  "abu dhabi":
    "Abu Dhabi focuses on long-term end-user stability, cultural districts, and premium waterfront living on islands like Saadiyat.",
  "ras al khaimah":
    "Ras Al Khaimah is accelerating with the Wynn mega resort, new freehold policies, and resort-style masterplans for lifestyle investors.",
  rak:
    "Ras Al Khaimah is accelerating with the Wynn mega resort, new freehold policies, and resort-style masterplans for lifestyle investors.",
  island:
    "Island developments such as Palm Jumeirah and The World combine waterfront exclusivity with branded hospitality partnerships.",
  "heart of europe":
    "The Heart of Europe delivers themed islands with managed holiday homes, attractive for short-stay revenue models.",
};

const propertyShowcase: PropertyCard[] = [
  {
    id: "prop-rent-001",
    title: "Beachfront 2-Bed Luxe",
    area: "Jumeirah 1",
    priceDisplay: "AED 200K / yearly",
    priceValue: 200000,
    bedrooms: "2",
    baths: "2",
    size: "1,500 sq.ft",
    type: "apartment",
    tenure: "rent",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=60",
    badges: ["Video tour", "Sea view"],
    highlights: ["Private beach access", "Steps from La Mer", "Vacant now"],
    availability: "Only 3 similar units left",
    incentives: "First 10 tenants get 1 month free",
  },
  {
    id: "prop-rent-002",
    title: "Umm Suqeim Family Villa",
    area: "Umm Suqeim 2",
    priceDisplay: "AED 380K / yearly",
    priceValue: 380000,
    bedrooms: "4",
    baths: "5",
    size: "4,200 sq.ft",
    type: "villa",
    tenure: "rent",
    image: "https://images.unsplash.com/photo-1613977256394-56cd371ee9a7?auto=format&fit=crop&w=800&q=60",
    badges: ["Open house", "Pool"],
    highlights: ["Private garden", "Walking distance to schools", "Smart home ready"],
    availability: "Open house this weekend",
    incentives: "Refer a friend & earn AED 5,000",
  },
  {
    id: "prop-buy-001",
    title: "Palm Marina Penthouses",
    area: "Palm Jumeirah",
    priceDisplay: "From AED 7.5M",
    priceValue: 7500000,
    bedrooms: "4",
    baths: "5",
    size: "5,200 sq.ft",
    type: "penthouse",
    tenure: "buy",
    image: "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=800&q=60",
    badges: ["Premium", "360° view"],
    highlights: ["Infinity pool", "Maid's room", "Private elevator"],
    availability: "Only 2 units left",
    incentives: "5% booking discount before month-end",
  },
  {
    id: "prop-invest-001",
    title: "Business Bay Canal Residences",
    area: "Business Bay",
    priceDisplay: "AED 1.9M",
    priceValue: 1900000,
    bedrooms: "2",
    baths: "3",
    size: "1,120 sq.ft",
    type: "apartment",
    tenure: "invest",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=60",
    badges: ["6.2% yield", "Handover 2025"],
    highlights: ["Flexible 70/30 plan", "Next to canal boardwalk", "Fully furnished"],
    availability: "Fast-moving stock",
    incentives: "Free property management for 1 year",
  },
  {
    id: "prop-rent-003",
    title: "Al Safa Designer Loft",
    area: "Al Safa 2",
    priceDisplay: "AED 95K / yearly",
    priceValue: 95000,
    bedrooms: "1",
    baths: "1",
    size: "850 sq.ft",
    type: "apartment",
    tenure: "rent",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=60",
    badges: ["Best value", "Ready"],
    highlights: ["Floor-to-ceiling glass", "Downtown skyline views", "Pet friendly"],
    availability: "5 people viewed today",
    incentives: "Rent-to-own conversation available",
  },
];

const featuredOffers: OfferBanner[] = [
  {
    id: "offer-limited-stock",
    title: "🎉 Only 3 beachfront villas left at this rate",
    description: "Secure a Jumeirah villa today and access our white-glove move-in concierge.",
    urgency: "Hot",
    cta: { id: "cta-tour", label: "🗓️ Schedule Tour Now", action: "schedule-tour" },
  },
  {
    id: "offer-open-house",
    title: "⏰ Open house this weekend",
    description: "Join our private walkthrough in Umm Suqeim 2. Slots disappear fast!",
    urgency: "Limited",
    cta: { id: "cta-book", label: "📅 Book Slot", action: "schedule-tour" },
  },
  {
    id: "offer-referral",
    title: "🎁 Refer & earn AED 5,000",
    description: "Share TRUE NESTER with friends relocating to Dubai and unlock referral rewards.",
    urgency: "New",
    cta: { id: "cta-brochure", label: "📥 Get Brochure", action: "get-brochure" },
  },
];

const proactiveTouchpoints: { id: string; delay: number; message: string; ctas: CTAButton[] }[] = [
  {
    id: "tp-20s",
    delay: 30000,
    message:
      "Found something interesting? I can help you schedule a tour today! Many buyers are rushing for these homes.",
    ctas: [
      { id: "cta-shortlist", label: "✅ Yes, shortlist", action: "connect-agent" },
      { id: "cta-tour", label: "🗓️ Schedule Tour", action: "schedule-tour" },
    ],
  },
  {
    id: "tp-45s",
    delay: 45000,
    message:
      "Tours are filling fast for waterfront homes. Should I pencil you in for a quick discovery call?",
    ctas: [
      { id: "cta-call", label: "📞 Call Expert", action: "connect-agent" },
      { id: "cta-email", label: "📧 Email me", action: "send-email" },
    ],
  },
  {
    id: "tp-90s",
    delay: 90000,
    message:
      "Only a couple of units remain under today's pricing. Want me to lock an option or send comparisons?",
    ctas: [
      { id: "cta-lock", label: "🔒 Hold Property", action: "connect-agent" },
      { id: "cta-more", label: "👀 Show similar", action: "view-details" },
    ],
  },
  {
    id: "tp-120s",
    delay: 120000,
    message:
      "Live demand alert: 5 people viewed this property in the last hour. Should I prioritize a tour slot for you?",
    ctas: [
      { id: "cta-priority", label: "🗓️ Prioritize tour", action: "schedule-tour" },
      { id: "cta-chat", label: "💬 Chat with advisor", action: "connect-agent" },
    ],
  },
  {
    id: "tp-150s",
    delay: 150000,
    message:
      "Before you go: want me to email the best properties + success stories from buyers like you?",
    ctas: [
      { id: "cta-email-pack", label: "📧 Send recap", action: "send-email" },
      { id: "cta-brochure-pack", label: "📥 Get brochure", action: "get-brochure" },
    ],
  },
];

const investmentIdeas = [
  {
    label: "Up to AED 1M",
    ideas:
      "JVC from AED 650K with 7% yields, IMPZ from AED 550K, select Ras Al Khaimah launches with post-handover plans.",
  },
  {
    label: "AED 1M - 2M",
    ideas:
      "Business Bay starting 900K, Dubai Marina 1.2M+, Dubai Hills apartments 1.1M+, Downtown resale units from 1.6M.",
  },
  {
    label: "AED 2M+",
    ideas: "Palm Jumeirah townhouses, Dubai Hills villas, Heart of Europe holiday homes with rental guarantees.",
  },
];

const budgetAdBuckets = [
  {
    max: 120000,
    lines: [
      "Great value apartments in Al Safa 2 with skyline views",
      "New launches in Al Manara offering flexible cheques",
    ],
  },
  {
    min: 120001,
    max: 400000,
    lines: [
      "Family villas near Jumeirah College with private pools",
      "Townhouses in Umm Suqeim 3 with beach boardwalk access",
    ],
  },
  {
    min: 400001,
    max: 800000,
    lines: [
      "Premium beachfront villas in Umm Suqeim 1",
      "Luxury apartments in Jumeirah 1 with private beach access",
    ],
  },
];

const commissionInfo =
  "TRUE NESTER provides full advisory, marketing, and transaction support with a 2% sales commission and 5% leasing fee, plus post-handover concierge.";

const serviceScope =
  "We source on-market & off-market stock, arrange developer appointments, negotiate on your behalf, and coordinate mortgage or Golden Visa partners.";

const countryCodes = [
  { label: "+971", country: "UAE", flag: "🇦🇪" },
  { label: "+91", country: "India", flag: "🇮🇳" },
  { label: "+44", country: "UK", flag: "🇬🇧" },
  { label: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { label: "+61", country: "Australia", flag: "🇦🇺" },
  { label: "+33", country: "France", flag: "🇫🇷" },
  { label: "+49", country: "Germany", flag: "🇩🇪" },
  { label: "+39", country: "Italy", flag: "🇮🇹" },
  { label: "+34", country: "Spain", flag: "🇪🇸" },
  { label: "+81", country: "Japan", flag: "🇯🇵" },
  { label: "+86", country: "China", flag: "🇨🇳" },
  { label: "+65", country: "Singapore", flag: "🇸🇬" },
  { label: "+60", country: "Malaysia", flag: "🇲🇾" },
  { label: "+62", country: "Indonesia", flag: "🇮🇩" },
  { label: "+66", country: "Thailand", flag: "🇹🇭" },
];

const supportedLanguages = ["English", "Hindi", "Urdu", "Arabic"];

const quickActions: QuickAction[] = [
  {
    id: "intent-buy",
    label: "🏠 I want to buy",
    description: "Secure a home or investment",
    variant: "primary",
    flowId: "buy",
  },
  {
    id: "intent-rent",
    label: "🔑 I want to rent",
    description: "Find a Dubai rental now",
    variant: "secondary",
    flowId: "rent",
  },
  {
    id: "intent-invest",
    label: "💰 I want to invest",
    description: "See high-yield launches",
    variant: "secondary",
    flowId: "invest",
  },
  {
    id: "intent-browse",
    label: "📊 Just browsing",
    description: "Show highlights & updates",
    variant: "secondary",
    fallbackMessage:
      "No rush! 75% of real estate brokerages now use AI to keep buyers informed. Let me send you curated market highlights and featured listings. Drop your email so I can share weekly releases?",
  },
];

const flowDefinitions: Record<string, FlowDefinition> = {
  buy: {
    id: "buy",
    steps: [
      {
        id: "buy-area",
        prompt: "Amazing! Which community do you want to explore first?",
        options: [
          { label: "Downtown Dubai" },
          { label: "Dubai Marina" },
          { label: "Business Bay" },
          { label: "Dubai Hills Estate" },
          { label: "Palm Jumeirah" },
          { label: "Arabian Ranches" },
        ],
        nextStepId: "buy-budget",
      },
      {
        id: "buy-budget",
        prompt: "Great taste! What's your purchase budget band?",
        options: [
          { label: "Under 2M AED" },
          { label: "2M - 4M AED" },
          { label: "4M - 8M AED" },
          { label: "8M+ Trophy Home" },
        ],
        nextStepId: "buy-property",
      },
      {
        id: "buy-property",
        prompt: "Perfect! What type of property suits you?",
        options: [
          { label: "Apartment", startLeadCapture: true },
          { label: "Villa", startLeadCapture: true },
          { label: "Townhouse", startLeadCapture: true },
          { label: "Penthouse", startLeadCapture: true },
        ],
      },
    ],
  },
  rent: {
    id: "rent",
    steps: [
      {
        id: "rent-area",
        prompt: "Looking to rent? Which Jumeirah area interests you?",
        options: [
          { label: "Umm Suqeim 1" },
          { label: "Umm Suqeim 2" },
          { label: "Umm Suqeim 3" },
          { label: "Jumeirah 1" },
          { label: "Jumeirah 2" },
          { label: "Jumeirah 3" },
          { label: "Al Manara" },
          { label: "Al Safa 1" },
          { label: "Al Safa 2" },
          { label: "Al Wasl" },
        ],
        nextStepId: "rent-budget",
      },
      {
        id: "rent-budget",
        prompt: "Select your annual rental budget below.",
        options: [
          { label: "AED 50K-100K Yearly" },
          { label: "AED 100K-200K Yearly" },
          { label: "AED 200K-300K Yearly" },
          { label: "AED 300K-400K Yearly" },
          { label: "AED 400K-500K Yearly" },
          { label: "AED 600K-700K Yearly" },
          { label: "AED 700K-800K Yearly" },
        ],
        nextStepId: "rent-property",
      },
      {
        id: "rent-property",
        prompt: "Select your ideal property type below.",
        options: [
          { label: "1-Bedroom Apartment", startLeadCapture: true },
          { label: "2-Bedroom Apartment", startLeadCapture: true },
          { label: "3-Bedroom Apartment", startLeadCapture: true },
          { label: "Villa", startLeadCapture: true },
          { label: "Townhouse", startLeadCapture: true },
          { label: "Studio", startLeadCapture: true },
          { label: "Penthouse", startLeadCapture: true },
        ],
      },
    ],
  },
  invest: {
    id: "invest",
    steps: [
      {
        id: "invest-area",
        prompt: "Great! Which hotspot should we analyze first?",
        options: [
          { label: "Business Bay" },
          { label: "Dubai Marina" },
          { label: "JVC" },
          { label: "Ras Al Khaimah" },
        ],
        nextStepId: "invest-budget",
      },
      {
        id: "invest-budget",
        prompt: "Investment opportunity! Pick your ticket size.",
        options: [
          { label: "Under 500K" },
          { label: "500K-1M" },
          { label: "1M-2M" },
          { label: "Above 2M" },
        ],
        nextStepId: "invest-goal",
      },
      {
        id: "invest-goal",
        prompt: "What's your primary goal?",
        options: [
          { label: "High Rental Yield", nextStepId: "invest-yield-areas" },
          { label: "Capital Appreciation", response: "Great! We can focus on Downtown or Dubai Hills off-plan phases for strong appreciation. Share your contact details and I’ll prepare options.", startLeadCapture: true },
          { label: "Both", response: "Balanced strategy noted. Business Bay, Dubai Marina, and JVC hybrids could work well. Send me your name, phone, and budget to proceed.", startLeadCapture: true },
          { label: "Not Sure", response: "No problem. I can walk you through yield vs appreciation plays once I have your contact details.", startLeadCapture: true },
        ],
      },
      {
        id: "invest-yield-areas",
        prompt: "Target yield hotspots:",
        options: [
          { label: "JVC (6-7%)", response: "JVC delivers 6-7% gross yields with steady tenant demand. Share contact info so I can send comps.", startLeadCapture: true },
          { label: "Business Bay (5-6%)", response: "Business Bay pairs 5-6% yields with central positioning. Drop your details to see exact numbers.", startLeadCapture: true },
          { label: "Dubai Marina (4-5%)", response: "Dubai Marina’s 4-5% yields come with blue-chip resale value. Send your contact for figures and availability.", startLeadCapture: true },
        ],
      },
    ],
  },
  offplan: {
    id: "offplan",
    steps: [
      {
        id: "offplan-areas",
        prompt: "Our latest developments include:",
        options: [
          { label: "ISLAND", response: "ISLAND launches focus on waterfront resorts with flexible 60/40 plans. Share your contact to receive brochures.", startLeadCapture: true },
          { label: "Heart of Europe", response: "Heart of Europe offers themed islands with rental guarantees. Send me your details for inventory.", startLeadCapture: true },
          { label: "Dubai Harbour", response: "Dubai Harbour combines marina-front towers and branded residences. Share your contact for availability.", startLeadCapture: true },
        ],
      },
    ],
  },
  communities: {
    id: "communities",
    steps: [
      {
        id: "community-list",
        prompt: "Explore communities below:",
        options: [
          { label: "JVC", response: "JVC: family-friendly, 6-7% yields. Tell me your requirements and contact to share listings.", startLeadCapture: true },
          { label: "Business Bay", response: "Business Bay: downtown adjacency, mixed-use skyline. Share contact for tailored insights.", startLeadCapture: true },
          { label: "Dubai Marina", response: "Dubai Marina: waterfront lifestyle. Send your contact to receive current availabilities.", startLeadCapture: true },
          { label: "Dubai Hills Estate", response: "Dubai Hills: master community with park and golf views. Provide contact info for curated options.", startLeadCapture: true },
          { label: "Downtown Dubai", response: "Downtown: iconic luxury residences. Share details and I’ll send opportunities.", startLeadCapture: true },
          { label: "Palm Jumeirah", response: "Palm: beachfront villas & apartments. Share name and phone for bespoke matches.", startLeadCapture: true },
        ],
      },
    ],
  },
  agent: {
    id: "agent",
    steps: [
      {
        id: "agent-contact",
        prompt: "Happy to connect you with a senior advisor. Ready to share your contact details?",
        options: [
          { label: "Yes, I’ll share now", response: "Great! I’ll capture your details step-by-step so our advisor can reach you.", startLeadCapture: true },
          { label: "Call me ASAP", response: "Understood. I’ll take your details right away so we can ring you within minutes.", startLeadCapture: true },
        ],
      },
    ],
  },
};

const requiredLocationKeywords = [
  "dubai",
  "abu dhabi",
  "ras al khaimah",
  "rak",
  "island",
  "heart of europe",
  "business bay",
  "dubai marina",
  "dubai hills",
  "dubai hills estate",
  "downtown",
  "jvc",
  "jumeirah village",
  "arabian ranches",
  "palm",
  "palm jumeirah",
];

const formatTimestamp = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

const getTimeGreeting = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "Good morning! ☀️";
  if (hour < 18) return "Good afternoon! 🍽️";
  if (hour < 22) return "Good evening! 🌆";
  return "Late night property hunter? 🌙";
};

const parseBudgetLabel = (label: string) => {
  const tokens = label.match(/\d+(?:\.\d+)?\s*[kKmM]?/g) || [];
  const toValue = (value: string) => {
    if (!value) return 0;
    const trimmed = value.replace(/\s/g, "");
    const numeric = parseFloat(trimmed.replace(/k|m/gi, ""));
    if (/m/i.test(trimmed)) return numeric * 1000000;
    if (/k/i.test(trimmed)) return numeric * 1000;
    return numeric;
  };
  const lower = label.toLowerCase();
  if (lower.includes("under")) {
    return { min: 0, max: toValue(tokens[0]) };
  }
  if (lower.includes("+") || lower.includes("above") || lower.includes("plus")) {
    return { min: toValue(tokens[0]), max: undefined };
  }
  if (tokens.length >= 2) {
    return { min: toValue(tokens[0]), max: toValue(tokens[1]) };
  }
  return { min: toValue(tokens[0]), max: undefined };
};

const getContextualAds = (budgetLabel: string) => {
  const { min, max } = parseBudgetLabel(budgetLabel);
  const yearlyValue = (max ?? min) || min;
  const bucket = budgetAdBuckets.find((entry) => {
    const minCheck = entry.min ? yearlyValue >= entry.min : true;
    const maxCheck = entry.max ? yearlyValue <= entry.max : true;
    return minCheck && maxCheck;
  });
  return bucket ? bucket.lines : ["Premium beach and waterfront stock is moving fast this week."];
};

const extractBudgetValue = (message: string) => {
  const match = message.replace(/[,\s]/g, "").match(/(\d+(?:\.\d+)?)(k|m|million)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") return value * 1000;
  if (suffix === "m" || suffix === "million") return value * 1000000;
  return value;
};

const detectPhone = (message: string) => {
  const match = message.replace(/[^\d+]/g, "").match(/\+?\d{7,15}/);
  return match ? match[0] : "";
};

const detectName = (message: string) => {
  const nameMatch = message.match(/my name is ([a-zA-Z\s]+)/i);
  if (nameMatch?.[1]) {
    return nameMatch[1].trim();
  }
  return "";
};

const detectLocations = (message: string) => {
  const lowered = message.toLowerCase();
  return requiredLocationKeywords.filter((keyword) => lowered.includes(keyword));
};


const getOfferBanners = (budgetLabel?: string): OfferBanner[] => {
  if (!budgetLabel) return featuredOffers.slice(0, 2);
  const ads = getContextualAds(budgetLabel);
  const contextualOffer: OfferBanner = {
    id: `ctx-${budgetLabel}`,
    title: "🔥 Curated picks based on your budget",
    description: ads.join(" • "),
    urgency: "Act fast",
    cta: { id: "cta-more-info", label: "💬 Chat with agent", action: "connect-agent" },
  };
  return [contextualOffer, ...featuredOffers.slice(0, 1)];
};

const scoreLead = (budgetLabel?: string, timeline?: string): LeadScore => {
  if (!budgetLabel) return { tier: "cold", value: 35, reasoning: "Need budget confirmation" };
  const { min, max } = parseBudgetLabel(budgetLabel);
  const annualValue = max ?? min;
  if (annualValue >= 400000) {
    return { tier: "hot", value: 92, reasoning: "Premium annual budget with waterfront interest" };
  }
  if (annualValue >= 150000) {
    return {
      tier: "warm",
      value: 78,
      reasoning: `Mid-tier annual budget${timeline ? ` with ${timeline} move timeline` : ""}`,
    };
  }
  return { tier: "cold", value: 55, reasoning: "Entry budget, nurture with value listings" };
};

const getNextLeadQuestion = (lead: LeadInfo) => {
  if (!lead.name) return "Could you share your name so I can personalize the consultation?";
  if (!lead.phone) return "May I have your phone number for our specialist to connect with you?";
  if (!lead.budget) return "What budget range should we keep in mind for your purchase or investment?";
  if (lead.locations.length === 0)
    return "Which communities or cities are you most interested in exploring?";
  return "";
};

const buildRecommendation = (budget: number | null) => {
  if (!budget) return "Share your budget so I can shortlist the best-performing districts for you.";
  const suited = communityInsights
    .filter((community) => budget >= community.minBudget * 0.8)
    .sort((a, b) => a.minBudget - b.minBudget)
    .slice(0, 3)
    .map(
      (community) =>
        `• ${community.name}: ${community.summary} Starting ~AED ${(
          community.minBudget / 1000000
        ).toFixed(2)}M, yields around ${community.averageYield}.`
    );
  return suited.length
    ? suited.join("\n")
    : "For this budget we can look at upcoming launches in JVC, IMPZ, or Ras Al Khaimah resort projects with attractive entry points.";
};

const generateCommunityInsight = (message: string) => {
  const lowered = message.toLowerCase();
  const matches = communityInsights.filter(
    (community) =>
      lowered.includes(community.name.toLowerCase()) ||
      (community.shortName && lowered.includes(community.shortName.toLowerCase()))
  );

  if (!matches.length) return "";

  return matches
    .map(
      (community) =>
        `${community.name}: ${community.summary} Property mix: ${community.propertyTypes}. Developers: ${community.developers}. Average yields around ${community.averageYield}.`
    )
    .join("\n\n");
};

const generateCityInsight = (message: string) => {
  const lowered = message.toLowerCase();
  const matchedEntry = Object.entries(cityHighlights).find(([key]) => lowered.includes(key));
  return matchedEntry ? matchedEntry[1] : "";
};

const TrueNesterChatbot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInFooter, setIsInFooter] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({ name: "", phone: "", email: "", budget: "", locations: [] });
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [leadStep, setLeadStep] = useState<"idle" | "name" | "email" | "phone">("idle");
  const [leadError, setLeadError] = useState("");
  const [leadFormValues, setLeadFormValues] = useState({
    name: "",
    email: "",
    countryCode: countryCodes[0].label,
    phone: "",
  });
  const [stepSelections, setStepSelections] = useState<Record<string, string>>({});
  const [rentSelection, setRentSelection] = useState({ area: "", budget: "", propertyType: "" });
  const [showProactivePrompt, setShowProactivePrompt] = useState(false);
  const [intent, setIntent] = useState<IntentType | null>(null);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [visitorProfile, setVisitorProfile] = useState<{ experience: "unknown" | "first-time" | "repeat"; moveTimeline: string }>({
    experience: "unknown",
    moveTimeline: ""
  });
  const [leadScore, setLeadScore] = useState<LeadScore>({ tier: "cold", value: 40, reasoning: "Need more context" });
  const [autoOffer, setAutoOffer] = useState<OfferBanner | null>(null);
  const [analytics, setAnalytics] = useState({
    popupViews: 0,
    popupEngagements: 0,
    propertyClicks: 0,
    savedProperties: 0,
    followUps: 0,
  });
  const [conversationId] = useState(() => createId());
  const [customerId] = useState(() => createId());
  const [leadSyncStatus, setLeadSyncStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [submittedConversations, setSubmittedConversations] = useState<string[]>([]);
  const MAX_SUBMISSIONS = 5;

  // Slack notifications are now handled entirely by the backend API
  // This eliminates duplicate notifications and race conditions
  const [realProperties, setRealProperties] = useState<PropertyCard[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await fetchRentalProperties();

        if (!data || data.length === 0) {
          console.warn("No rental properties available");
          return;
        }

        // Map properties with async signed URLs - fixes the dummy image issue after redeployment
        const mappedPromises = data.slice(0, 50).map(async (p: any) => {
          const feats = Array.isArray(p.features) ? (p.features as string[]) : [];
          
          // Debug property data
          console.log(`[CHATBOT] 🔄 Processing property ${p.id}: featured_image = "${p.featured_image}"`);
          
          // Get signed URL for the image (this fixes the dummy image issue)
          const signedImageUrl = await getSignedImageUrl(p.featured_image);
          console.log(`[CHATBOT] 🖼️ Image URL for ${p.id}: ${signedImageUrl}`);
          
          return {
            id: p.id,
            title: p.title,
            area: p.area || p.location || "Dubai",
            priceDisplay: p.price_display || `AED ${p.price?.toLocaleString() ?? "P.O.A"}`,
            priceValue: p.price || 0,
            bedrooms: String(p.bedrooms || 0),
            baths: String(p.bathrooms || 0),
            size: `${p.size_sqft || 0} sq.ft`,
            type: (p.property_type?.toLowerCase() as any) || "apartment",
            tenure: p.purpose?.toLowerCase().includes("rent") ? "rent" : "buy",
            image: signedImageUrl,
            badges: feats.slice(0, 2),
            highlights: feats.slice(0, 3),
            availability: "Available",
          };
        });
        
        const mapped: PropertyCard[] = await Promise.all(mappedPromises);
        setRealProperties(mapped);
      } catch (error) {
        console.error("Exception fetching chatbot properties:", error);
      }
    };

    fetchProperties();
  }, []);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchpointIndexRef = useRef(0);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, leadStep, showMainMenu]);
  const profileCompletion = Math.min(
    20 +
      (leadInfo.name ? 20 : 0) +
      (leadInfo.email ? 20 : 0) +
      (leadInfo.phone ? 20 : 0) +
      (savedProperties.length ? 20 : 0),
    100
  );

  const trackAnalytics = (key: keyof typeof analytics) => {
    setAnalytics((prev) => {
      const nextValue = (prev[key] ?? 0) + 1;
      if (typeof window !== "undefined") {
        const typedWindow = window as typeof window & { dataLayer?: Record<string, unknown>[] };
        typedWindow.dataLayer = typedWindow.dataLayer || [];
        typedWindow.dataLayer.push({ event: "tn-chat-analytics", metric: key, value: nextValue });
      }
      return { ...prev, [key]: nextValue };
    });
  };

  const queueNextTouchpoint = () => {
    if (touchpointIndexRef.current >= proactiveTouchpoints.length) return;
    const touchpoint = proactiveTouchpoints[touchpointIndexRef.current];
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      appendBotMessage(touchpoint.message, { ctas: touchpoint.ctas, tone: "info" });
      touchpointIndexRef.current += 1;
      queueNextTouchpoint();
    }, touchpoint.delay);
  };

  const acknowledgeInteraction = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    queueNextTouchpoint();
  };

  const resetFlowContexts = () => {
    setStepSelections({});
    setRentSelection({ area: "", budget: "", propertyType: "" });
  };

  const buildRentSummary = (propertyType: string, context = rentSelection) => {
    const area = context.area || "Jumeirah";
    const budgetLabel = context.budget?.replace(/\s*Yearly$/i, "") ?? "";
    const budget = budgetLabel ? `${budgetLabel} annual budget` : "your preferred annual budget";
    const upsell =
      propertyType.includes("2-Bedroom") && context.budget?.includes("200K-300K")
        ? " Just so you know, the 3-bed in the same building is only AED 50K more and comes with a killer view. Interested in comparing?"
        : "";
    return `Got it! I'll shortlist ${propertyType} options aligned with ${budget} in ${area}. Let me grab your contact details so our leasing specialist can send tailored listings.${upsell}`;
  };

  useEffect(() => {
    const greeting = `${getTimeGreeting()} I'm the TRUE NESTER concierge.\nWelcome! How can I assist you in finding your perfect property in Dubai today?`;
    setMessages([
      {
        id: createId(),
        sender: "bot",
        text: `${greeting}\nI can help in ${supportedLanguages.join(", ")} and surface handpicked listings within seconds.\n\n💡 You can submit up to ${MAX_SUBMISSIONS} different inquiries with me to explore various property options!`,
        timestamp: formatTimestamp(),
        isoTimestamp: new Date().toISOString(),
      },
    ]);
    setAutoOffer(featuredOffers[0]);
  }, []);

  // Check if user is hovering over footer
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const chatbotButton = document.querySelector('[data-chatbot-button]');
        if (chatbotButton) {
          const buttonRect = chatbotButton.getBoundingClientRect();
          // Check if chatbot button overlaps with footer
          const isOverlapping = buttonRect.bottom > footerRect.top;
          setIsInFooter(isOverlapping);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for image zoom events from PropertyDetail page
  useEffect(() => {
    const handleImageZoom = (event: CustomEvent) => {
      setIsImageZoomed(event.detail.zoomed);
    };

    window.addEventListener('imageZoomChanged' as any, handleImageZoom);
    
    return () => {
      window.removeEventListener('imageZoomChanged' as any, handleImageZoom);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check how many times popup has been shown this session
    const popupCountStr = sessionStorage.getItem(proactivePopupSessionKey);
    const popupCount = popupCountStr ? parseInt(popupCountStr, 10) : 0;
    
    // Stop showing if already shown MAX_POPUP_SHOWS times
    if (popupCount >= MAX_POPUP_SHOWS) return;
    
    popupTimerRef.current = setTimeout(() => {
      setShowProactivePrompt(true);
      trackAnalytics("popupViews");
      // Increment popup count
      sessionStorage.setItem(proactivePopupSessionKey, String(popupCount + 1));
    }, 8000); // Show popup after 8 seconds

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [showProactivePrompt]);

  // Lock body scroll when chatbot is open (mobile only)
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      touchpointIndexRef.current = 0;
      queueNextTouchpoint();
    } else if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = setTimeout(() => {
        appendBotMessage(
          "Don't go just yet! I can email you the full brochure plus similar properties so you don't lose momentum.",
          {
            ctas: [
              { id: "cta-brochure", label: "📥 Send brochure", action: "get-brochure" },
              { id: "cta-whatsapp", label: "💬 WhatsApp reminder", action: "connect-agent" },
            ],
            tone: "promo",
          }
        );
        trackAnalytics("followUps");
      }, 30000);
    } else if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
    }
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (savedProperties.length === 5) {
      appendBotMessage(
        "🎯 Gamification unlocked! You saved 5+ properties and earned an AED 500 lifestyle voucher once you complete onboarding.",
        {
          ctas: [{ id: "cta-complete", label: "✅ Complete profile", action: "connect-agent" }],
          tone: "success",
        }
      );
    }
  }, [savedProperties.length, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    // If we are in a lead capture flow, route to lead handler
    if (leadStep !== "idle") {
      handleLeadInput(input.trim());
      setInput("");
      return;
    }

    const outgoing: ChatMessage = {
      id: createId(),
      sender: "user",
      text: input.trim(),
      timestamp: formatTimestamp(),
      isoTimestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, outgoing]);
    const pendingInput = input.trim();
    setInput("");
    setIsThinking(true);
    acknowledgeInteraction();

    setTimeout(() => {
      const { reply, updatedLead } = buildBotReply(pendingInput, leadInfo);
      setLeadInfo(updatedLead);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: "bot",
          text: reply,
          timestamp: formatTimestamp(),
          isoTimestamp: new Date().toISOString(),
        },
      ]);
      setIsThinking(false);
    }, 450);
  };

  const startFlow = (flowId: string) => {
    const flow = flowDefinitions[flowId];
    if (!flow || flow.steps.length === 0) return;
    resetFlowContexts();
    setActiveFlowId(flowId);
    setActiveStepId(flow.steps[0].id);
    appendBotMessage(flow.steps[0].prompt);
  };

  const appendBotMessage = (
    text: string,
    extras?: Partial<Omit<ChatMessage, "id" | "sender" | "text" | "timestamp" | "isoTimestamp">>
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        sender: "bot",
        text,
        timestamp: formatTimestamp(),
        isoTimestamp: new Date().toISOString(),
        ...extras,
      },
    ]);
  };

  const appendUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        sender: "user",
        text,
        timestamp: formatTimestamp(),
        isoTimestamp: new Date().toISOString(),
      },
    ]);
  };

  const persistConversationToAdmin = useCallback(
    async (finalLead: LeadInfo, attempt = 1): Promise<void> => {
      if (!CHATBOT_LEAD_ENDPOINT) {
        console.warn("CHATBOT lead endpoint is not configured");
        return;
      }
      if (submissionCount >= MAX_SUBMISSIONS) {
        console.log(`[CHATBOT] Maximum submissions reached (${MAX_SUBMISSIONS}), preventing further submissions`);
        appendBotMessage(
          `You've reached the maximum of ${MAX_SUBMISSIONS} conversation submissions. Our team will review your previous inquiries and get back to you soon!`,
          { tone: "info" }
        );
        return;
      }
      if (!finalLead.name || !finalLead.phone) return;

      setLeadSyncStatus("pending");

      const budgetPreference =
        finalLead.budget ||
        rentSelection.budget ||
        stepSelections["buy-budget"] ||
        stepSelections["invest-budget"] ||
        "";
      const preferredArea =
        finalLead.locations[0] ||
        rentSelection.area ||
        stepSelections["buy-area"] ||
        stepSelections["invest-area"] ||
        "";
      const propertyPreference = rentSelection.propertyType || stepSelections["buy-property"] || "";

      const conversationTags = Array.from(
        new Set(
          [
            intent ?? undefined,
            preferredArea || undefined,
            propertyPreference || undefined,
            ...finalLead.locations,
            ...savedProperties.map((id) => `saved:${id}`),
          ].filter((tag): tag is string => Boolean(tag))
        )
      );

      const noteParts = [
        budgetPreference ? `Budget: ${budgetPreference}` : null,
        preferredArea ? `Area: ${preferredArea}` : null,
        propertyPreference ? `Property: ${propertyPreference}` : null,
        visitorProfile.moveTimeline ? `Timeline: ${visitorProfile.moveTimeline}` : null,
      ].filter((entry): entry is string => Boolean(entry));

      // Extract property images from messages with cards
      const propertyImages: string[] = [];
      const propertyDetails: Array<{ title: string; image: string; price: string; area: string }> = [];
      
      messages.forEach((message) => {
        if (message.cards && Array.isArray(message.cards)) {
          message.cards.forEach((card) => {
            if (card.image && !propertyImages.includes(card.image)) {
              propertyImages.push(card.image);
              propertyDetails.push({
                title: card.title || 'Property',
                image: card.image,
                price: card.priceDisplay || 'P.O.A',
                area: card.area || 'Dubai'
              });
            }
          });
        }
      });

      const payload = {
        conversationId,
        customerId,
        customerName: finalLead.name,
        customerPhone: finalLead.phone,
        customerEmail: finalLead.email || undefined,
        intent: intent ?? undefined,
        budget: budgetPreference || undefined,
        preferredArea: preferredArea || undefined,
        propertyType: propertyPreference || undefined,
        leadScore: leadScore.value,
        leadQuality: leadScore.tier,
        tags: conversationTags,
        notes: noteParts.join(" | ") || undefined,
        leadScoreBreakdown: {
          tier: leadScore.tier,
          total: leadScore.value,
          reasoning: leadScore.reasoning,
          profileCompletion,
          savedProperties: savedProperties.length,
          images: propertyImages,
          propertyDetails: propertyDetails,
        },
        metadata: {
          source: "website-chatbot",
          analytics,
          visitorProfile,
          rentSelection,
          stepSelections,
        },
        messages: messages.map((message) => ({
          id: message.id,
          sender: message.sender === "user" ? "customer" : message.sender,
          messageText: message.text,
          messageType: message.cards ? "cards" : message.offers ? "offer" : "text",
          timestamp: message.isoTimestamp,
          metadata: {
            tone: message.tone,
            cards: message.cards ?? null,
            ctas: message.ctas ?? null,
            offers: message.offers ?? null,
          },
        })),
      };

      try {
        console.log(`[CHATBOT] 🚀 Submitting lead to: ${CHATBOT_LEAD_ENDPOINT}`);
        console.log(`[CHATBOT] Payload:`, { 
          customerName: payload.customerName, 
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail,
          intent: payload.intent,
          messagesCount: payload.messages?.length
        });
        
        const response = await fetch(CHATBOT_LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[CHATBOT] ❌ API Error ${response.status}:`, errorText);
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const body = (await response.json()) as { id?: string };
        console.log(`[CHATBOT] ✅ Lead submitted successfully. Conversation ID: ${body.id}`);
        
        const newConversationId = body.id ?? payload.conversationId ?? conversationId;
        
        // Backend API handles Slack notifications automatically
        console.log("[CHATBOT] ✅ Backend API will handle Slack notification for conversation:", newConversationId);
        
        setSubmissionCount(prev => prev + 1);
        setSubmittedConversations(prev => [...prev, newConversationId]);
        setLeadSyncStatus("success");
        
        const remainingSubmissions = MAX_SUBMISSIONS - (submissionCount + 1);
        console.log(`[CHATBOT] ✅ Submission ${submissionCount + 1}/${MAX_SUBMISSIONS} successful. ${remainingSubmissions} remaining.`);
        
        // Inform user about multiple submission capability
        if (submissionCount + 1 < MAX_SUBMISSIONS) {
          setTimeout(() => {
            appendBotMessage(
              `✅ Great! Your inquiry has been submitted successfully. You can submit up to ${remainingSubmissions} more conversations if you have additional questions or requirements.`,
              { tone: "success" }
            );
          }, 1500);
        } else {
          setTimeout(() => {
            appendBotMessage(
              `✅ Perfect! This was your final submission (${MAX_SUBMISSIONS}/${MAX_SUBMISSIONS}). Our team will review all your inquiries and provide comprehensive assistance.`,
              { tone: "success" }
            );
          }, 1500);
        }
      } catch (error) {
        console.error("[CHATBOT] ❌ Lead sync failed:", error);
        console.log(`[CHATBOT] Attempt ${attempt}/3 - API endpoint: ${CHATBOT_LEAD_ENDPOINT}`);
        
        if (attempt < 3) {
          console.log(`[CHATBOT] Retrying in ${1500 * attempt}ms...`);
          setTimeout(() => {
            void persistConversationToAdmin(finalLead, attempt + 1);
          }, 1500 * attempt);
          return;
        }
        
        // Fallback: Save directly to Supabase if API failed after all retries
        try {
          console.log("[CHATBOT] 🔄 All API attempts failed, falling back to direct Supabase save...");
          const conversationData = await insertConversation({
            customer_id: payload.customerId,
            customer_name: finalLead.name,
            customer_phone: finalLead.phone,
            customer_email: finalLead.email || null,
            intent: payload.intent || "browse",
            budget: finalLead.budget || null,
            preferred_area: finalLead.locations?.join(", ") || null,
            lead_score: leadScore.value || 50,
            lead_quality: leadScore.tier || "warm",
            status: "new",
            tags: ["chatbot", "web"],
            start_time: new Date().toISOString(),
            lead_score_breakdown: {
              analytics,
              visitorProfile,
              profileCompletion,
            },
          });

          const newConversation = conversationData[0];

          // Save messages
          const messagesToSave = payload.messages.map((msg) => ({
            conversation_id: newConversation.id,
            sender: msg.sender,
            message_text: msg.messageText,
            message_type: msg.messageType,
            timestamp: new Date().toISOString(),
          }));

          await insertChatMessages(messagesToSave);

          // Fallback save completed - backend API wasn't available but data is preserved
          console.log("[CHATBOT] ✅ Fallback save completed - conversation preserved in database");

          setSubmissionCount(prev => prev + 1);
          setSubmittedConversations(prev => [...prev, newConversation.id]);
          setLeadSyncStatus("success");
          
          const remainingSubmissions = MAX_SUBMISSIONS - (submissionCount + 1);
          console.log(`[CHATBOT] ✅ Fallback submission ${submissionCount + 1}/${MAX_SUBMISSIONS} successful. ${remainingSubmissions} remaining.`);
          
          // Inform user about multiple submission capability (fallback path)
          if (submissionCount + 1 < MAX_SUBMISSIONS) {
            setTimeout(() => {
              appendBotMessage(
                `✅ Your inquiry has been saved successfully! You can submit up to ${remainingSubmissions} more conversations if you need additional assistance.`,
                { tone: "success" }
              );
            }, 1500);
          } else {
            setTimeout(() => {
              appendBotMessage(
                `✅ Perfect! This was your final submission (${MAX_SUBMISSIONS}/${MAX_SUBMISSIONS}). Our team will review all your inquiries comprehensively.`,
                { tone: "success" }
              );
            }, 1500);
          }
          console.log("✅ Supabase fallback successful!");
        } catch (fallbackError) {
          console.error("[CHATBOT] ❌ Supabase fallback also failed:", fallbackError);
          setLeadSyncStatus("error");
          
          appendBotMessage(
            "⚠️ I'm experiencing technical difficulties saving your inquiry. Don't worry - I've captured your details and our technical team has been alerted. You can also reach us directly at +971 4 123 4567 or info@truenester.com for immediate assistance.",
            { tone: "warning" }
          );
        }
      }
    },
    [
      analytics,
      appendBotMessage,
      conversationId,
      customerId,
      intent,
      leadScore,
      messages,
      profileCompletion,
      rentSelection,
      savedProperties,
      stepSelections,
      submissionCount,
      MAX_SUBMISSIONS,
      visitorProfile,
    ]
  );

  const getPropertyMatches = (intent: IntentType | null, area?: string, budgetLabel?: string) => {
    const { min, max } = budgetLabel ? parseBudgetLabel(budgetLabel) : { min: 0, max: undefined };
    // Prioritize real properties, fallback to showcase if empty (or remove showcase if strictly no mock data desired)
    const source = realProperties.length > 0 ? realProperties : propertyShowcase;

    return source
      .filter((property) => {
        const tenureMatch =
          intent && intent !== "browse"
            ? property.tenure === (intent === "buy" ? "buy" : intent === "invest" ? "invest" : intent)
            : true;
        const areaMatch = area ? property.area.toLowerCase().includes(area.toLowerCase()) : true;
        const valueMatch = (() => {
          if (!min && !max) return true;
          if (max) return property.priceValue >= min && property.priceValue <= max;
          return property.priceValue >= min;
        })();
        return tenureMatch && areaMatch && valueMatch;
      })
      .slice(0, 3);
  };

  const showcaseProperties = (intentType: IntentType | null, areaName?: string, budgetLabel?: string) => {
    const matches = getPropertyMatches(intentType, areaName, budgetLabel);
    if (!matches.length) return;
    appendBotMessage(
      "Here are handpicked options based on what you like. Tap to view details, save them, or schedule a tour.",
      {
        cards: matches,
        ctas: [
          { id: "cta-tour", label: "🗓️ Schedule Tour", action: "schedule-tour" },
          { id: "cta-save", label: "✅ Save Property", action: "save-property" },
          { id: "cta-agent", label: "💬 Chat with agent", action: "connect-agent" },
        ],
      }
    );
    setAutoOffer((prev) => prev ?? featuredOffers[1] ?? null);
  };

  const inferAreaPreference = () =>
    rentSelection.area || stepSelections["buy-area"] || stepSelections["invest-area"] || leadInfo.locations[0] || "Dubai";

  const inferBudgetPreference = () =>
    rentSelection.budget || stepSelections["buy-budget"] || stepSelections["invest-budget"] || leadInfo.budget;

  const pushContextualOffers = (budgetLabel?: string) => {
    const offers = getOfferBanners(budgetLabel);
    setAutoOffer(offers[0] ?? null);
    appendBotMessage(
      "Hot offers buyers are grabbing right now:",
      {
        offers,
        tone: "promo",
      }
    );
  };

  const announceLeadScore = (_score: LeadScore) => {
    // Removed: No longer announcing lead scores to users
  };

  const handleCTAAction = (cta: CTAButton, property?: PropertyCard) => {
    acknowledgeInteraction();
    switch (cta.action) {
      case "schedule-tour":
        appendBotMessage(
          "Amazing! I'll lock a 15-minute walkthrough. What's your preferred date or timeframe?",
          { tone: "success" }
        );
        startLeadCapture();
        break;
      case "connect-agent":
        appendBotMessage(
          "I'll have a senior TRUE NESTER advisor connect within minutes. Could you share the best phone number?",
          { tone: "info" }
        );
        startLeadCapture();
        break;
      case "send-email":
        appendBotMessage("Great! I'll grab your details so I can email brochures plus similar properties.");
        startLeadCapture();
        break;
      case "view-details":
        if (property) {
          trackAnalytics("propertyClicks");
          appendBotMessage(
            `📍 ${property.area} | ${property.title}\n${property.highlights.join(
              " • "
            )}\nThis property looks perfect for your budget. Want me to keep the momentum going?`,
            {
              ctas: [
                { id: "cta-tour", label: "📅 Schedule a tour", action: "schedule-tour" },
                { id: "cta-email", label: "📧 Send details", action: "send-email" },
                { id: "cta-agent", label: "🤝 Connect with agent", action: "connect-agent" },
              ],
            }
          );
        } else {
          appendBotMessage(
            "I'll line up a fresh batch of similar homes. Here's what matches your vibe right now:",
            { tone: "info" }
          );
          showcaseProperties(intent, inferAreaPreference(), inferBudgetPreference());
        }
        break;
      case "save-property":
        if (property) {
          setSavedProperties((prev) => Array.from(new Set([...prev, property.id])));
          trackAnalytics("savedProperties");
          appendBotMessage(
            `Saved! Once we collect your details I'll email a wishlist with ${property.title} plus 3 similar homes.`
          );
        }
        break;
      case "request-finance":
        appendBotMessage(
          "We partner with top banks for 50/50, rent-to-own, and Golden Visa packages. Want a mortgage pre-approval checklist?",
          { tone: "info" }
        );
        break;
      case "get-brochure":
        appendBotMessage("Happy to send it! I'll just capture your contact quickly so nothing gets lost.");
        startLeadCapture();
        break;
      default:
        appendBotMessage("Noted! I'll route this to our advisory team.");
    }
  };

  const handleQuickActionSelect = (action: QuickAction) => {
    setShowMainMenu(false);
    appendUserMessage(action.label);
    acknowledgeInteraction();
    if (action.flowId && flowDefinitions[action.flowId]) {
      setIntent(action.flowId as IntentType);
      startFlow(action.flowId);
    } else if (action.fallbackMessage) {
      setIntent("browse");
      appendBotMessage(action.fallbackMessage);
      showcaseProperties(null, undefined, undefined);
    } else {
      appendBotMessage("I’ll gather more info and get back to you shortly.");
    }
  };

  const handlePopupIntentSelect = (action: QuickAction) => {
    trackAnalytics("popupEngagements");
    setShowProactivePrompt(false);
    setIsOpen(true);
    handleQuickActionSelect(action);
  };

  const dismissPopup = () => {
    setShowProactivePrompt(false);
  };

  const resetToMainMenu = () => {
    setActiveFlowId(null);
    setActiveStepId(null);
    setShowMainMenu(true);
    resetFlowContexts();
    setIntent(null);
  };

  const handleBackToMenu = () => {
    resetToMainMenu();
    appendBotMessage("Sure, pick another quick option below.");
  };

  const getCurrentStep = () => {
    if (!activeFlowId || !activeStepId) return null;
    const flow = flowDefinitions[activeFlowId];
    return flow?.steps.find((step) => step.id === activeStepId) ?? null;
  };

  const handleStepOptionSelect = (option: FlowOption) => {
    const currentStep = getCurrentStep();
    const isRentFlow = activeFlowId === "rent";
    const userMessageText = isRentFlow && option.label ? `✓ ${option.label}` : option.label;
    if (currentStep?.id) {
      setStepSelections((prev) => ({ ...prev, [currentStep.id]: option.label }));
    }

    let nextRentSelection = rentSelection;
    if (isRentFlow && currentStep) {
      if (currentStep.id === "rent-area") {
        nextRentSelection = { area: option.label, budget: "", propertyType: "" };
        setRentSelection(nextRentSelection);
      } else if (currentStep.id === "rent-budget") {
        const areaValue = stepSelections["rent-area"] || rentSelection.area || "Jumeirah";
        nextRentSelection = { area: areaValue, budget: option.label, propertyType: "" };
        setRentSelection(nextRentSelection);
      } else if (currentStep.id === "rent-property") {
        const areaValue = stepSelections["rent-area"] || rentSelection.area;
        const budgetValue = stepSelections["rent-budget"] || rentSelection.budget;
        nextRentSelection = { area: areaValue, budget: budgetValue, propertyType: option.label };
        setRentSelection(nextRentSelection);
      }
    }

    appendUserMessage(userMessageText);
    acknowledgeInteraction();
    const flow = activeFlowId ? flowDefinitions[activeFlowId] : null;
    if (!flow) return;

    const stepDefinition = flow.steps.find((step) => step.id === activeStepId);
    const nextStepId = option.nextStepId ?? stepDefinition?.nextStepId ?? null;

    let customResponse: string | undefined;
    if (stepDefinition) {
      if (isRentFlow) {
        if (stepDefinition.id === "rent-area") {
          customResponse = `${option.label} – great choice! What's your annual budget?`;
        } else if (stepDefinition.id === "rent-budget") {
          const areaName = nextRentSelection.area || rentSelection.area || "this area";
          const normalizedBudget = option.label.replace(/^AED\s*/i, "").replace(/\s*Yearly$/i, "");
          customResponse = `Great choice! ${normalizedBudget}/year in ${areaName}. Let me connect you with our specialist.`;
        } else if (stepDefinition.id === "rent-property") {
          customResponse = buildRentSummary(option.label, nextRentSelection);
        } else {
          customResponse = option.response;
        }
      } else if (activeFlowId === "buy") {
        if (stepDefinition.id === "buy-area") {
          customResponse = `${option.label} is a fantastic area! What's your budget range?`;
        } else if (stepDefinition.id === "buy-budget") {
          const areaName = stepSelections["buy-area"] || "Dubai";
          customResponse = `Perfect! I'll find options in ${areaName} within ${option.label}. Let me connect you with our team.`;
        } else if (stepDefinition.id === "buy-property") {
          customResponse = `Great! I'll shortlist ${option.label} options for you. Share your details to proceed.`;
        } else {
          customResponse = option.response;
        }
      } else if (activeFlowId === "invest") {
        if (stepDefinition.id === "invest-area") {
          customResponse = `${option.label} – solid choice for investors! What's your budget?`;
        } else if (stepDefinition.id === "invest-budget") {
          const areaName = stepSelections["invest-area"] || "Dubai";
          customResponse = `Got it! ${option.label} in ${areaName}. Let me connect you with our investment advisor.`;
        } else if (stepDefinition.id === "invest-goal") {
          customResponse = option.response;
        } else if (stepDefinition.id === "invest-yield-areas") {
          customResponse = option.response;
        } else {
          customResponse = option.response;
        }
      } else {
        customResponse = option.response;
      }
    }

    if (customResponse) {
      appendBotMessage(customResponse);
    }

    if (activeFlowId === "rent" && stepDefinition) {
      if (stepDefinition.id === "rent-budget") {
        showcaseProperties("rent", nextRentSelection.area, option.label);
        pushContextualOffers(option.label);
        const score = scoreLead(option.label);
        setLeadScore(score);
        announceLeadScore(score);
      }
      if (stepDefinition.id === "rent-property") {
        const score = scoreLead(nextRentSelection.budget);
        setLeadScore(score);
        announceLeadScore(score);
      }
    }

    if (activeFlowId === "buy" && stepDefinition) {
      if (stepDefinition.id === "buy-budget") {
        const areaName = stepSelections["buy-area"];
        showcaseProperties("buy", areaName, option.label);
        pushContextualOffers(option.label);
        const score = scoreLead(option.label);
        setLeadScore(score);
        announceLeadScore(score);
      }
    }

    if (activeFlowId === "invest" && stepDefinition) {
      if (stepDefinition.id === "invest-budget") {
        const areaName = stepSelections["invest-area"];
        showcaseProperties("invest", areaName, option.label);
        pushContextualOffers(option.label);
        const score = scoreLead(option.label);
        setLeadScore(score);
        announceLeadScore(score);
      }
    }

    if (nextStepId) {
      setActiveStepId(nextStepId);
      const nextStep = flow.steps.find((step) => step.id === nextStepId);
      if (nextStep) {
        appendBotMessage(nextStep.prompt);
      } else {
        setActiveStepId(null);
        setActiveFlowId(null);
        if (!customResponse) {
          appendBotMessage("Great choice! Share your contact details so I can personalize the shortlist.");
        }
        if (option.startLeadCapture) {
          startLeadCapture();
        }
      }
    } else {
      setActiveStepId(null);
      setActiveFlowId(null);
      if (!customResponse) {
        appendBotMessage("Great choice! Share your contact details so I can personalize the shortlist.");
      }
      if (option.startLeadCapture) {
        startLeadCapture();
      }
    }
  };

  const startLeadCapture = () => {
    if (leadStep !== "idle") return;
     acknowledgeInteraction();
    setShowMainMenu(false);
    setLeadFormValues({ name: "", email: "", countryCode: countryCodes[0].label, phone: "" });
    setLeadStep("name");
    setLeadError("");
    appendBotMessage("Perfect! Before we connect you with our expert, what's your name?");
  };

  const handleLeadInput = (value: string) => {
    acknowledgeInteraction();
    if (leadStep === "name") {
      if (value.trim().length < 2) {
        setLeadError("Please enter at least 2 characters.");
        return;
      }
      setLeadError("");
      const trimmed = value.trim();
      appendUserMessage(trimmed);
      setLeadInfo((prev) => ({ ...prev, name: trimmed }));
      setLeadStep("email");
      appendBotMessage(`Thanks, ${trimmed}! What's your email address?`);
      return;
    }

    if (leadStep === "email") {
      const emailValue = value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        setLeadError("Please enter a valid email address.");
        return;
      }
      setLeadError("");
      appendUserMessage(emailValue);
      setLeadInfo((prev) => ({ ...prev, email: emailValue }));
      setLeadStep("phone");
      appendBotMessage("And what's your WhatsApp number so we can reach you easily?");
      return;
    }

    if (leadStep === "phone") {
      const digitsOnly = value.replace(/[^0-9]/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setLeadError("Phone number should be between 7 and 15 digits.");
        return;
      }
      setLeadError("");
      const formattedPhone = `${leadFormValues.countryCode} ${digitsOnly}`;
      appendUserMessage(formattedPhone);
      const updatedLead: LeadInfo = { ...leadInfo, phone: formattedPhone };
      setLeadInfo(updatedLead);
      setLeadStep("idle");
      setLeadFormValues({ name: "", email: "", countryCode: countryCodes[0].label, phone: "" });
      appendBotMessage("Amazing! Our TRUE NESTER advisor will reach out shortly with tailored recommendations.");
      void persistConversationToAdmin(updatedLead);
      resetToMainMenu();
    }
  };

  const buildBotReply = (message: string, currentLead: LeadInfo) => {
    const updatedLead = mergeLeadInfo(message, currentLead);
    const lowered = message.toLowerCase();
    const parts: string[] = [];

    if (lowered.includes("first time")) {
      setVisitorProfile((prev) => ({ ...prev, experience: "first-time" }));
    }
    if (lowered.includes("back again") || lowered.includes("return")) {
      setVisitorProfile((prev) => ({ ...prev, experience: "repeat" }));
    }

    const budgetValue = extractBudgetValue(message);
    if (budgetValue && !updatedLead.budget) {
      updatedLead.budget = `AED ${budgetValue.toLocaleString()}`;
    }
    if (budgetValue) {
      parts.push(`Great budget insight. ${buildRecommendation(budgetValue)}`);
    }

    const communityInsight = generateCommunityInsight(message);
    if (communityInsight) parts.push(communityInsight);

    const cityInsight = generateCityInsight(message);
    if (cityInsight) parts.push(cityInsight);

    if (lowered.includes("invest")) {
      parts.push(
        "Dubai favours 5-7% gross rental yields in established zones, while off-plan launches can deliver staged capital appreciation."
      );
    }

    if (lowered.includes("rent") || lowered.includes("yield")) {
      parts.push("Average yields: JVC 7%, Business Bay 6.5%, Dubai Marina 6%, Palm Jumeirah 5.2%.");
    }

    if (["commission", "fee", "charge"].some((keyword) => lowered.includes(keyword))) {
      parts.push(commissionInfo);
    }

    if (["service", "scope", "support", "help"].some((keyword) => lowered.includes(keyword))) {
      parts.push(serviceScope);
    }

    if (["finance", "mortgage", "payment plan", "emi"].some((keyword) => lowered.includes(keyword))) {
      parts.push(
        "YES! We offer flexible payment plans such as 50/50 (50% now, 50% on handover), rent-to-own pathways, mortgage pre-approvals within 48h, and Golden Visa assistance through partner banks. Want me to loop in our finance specialist?"
      );
    }

    if (["tax", "vat", "transfer fee"].some((keyword) => lowered.includes(keyword))) {
      parts.push(
        "Dubai purchase costs cheat sheet: Transfer fee 4% (usually split 2% each side), agency commission ~2%, trustee fee from AED 4,000, and no annual property tax. Need an exact cost breakdown for this listing?"
      );
    }

    if (parts.length === 0) {
      parts.push(
        "I'm not completely sure about that. Let me connect you with our expert agent who can provide accurate information."
      );
    }

    if (visitorProfile.experience === "first-time") {
      parts.push("Love guiding first-time buyers. I can break down each step so it never feels overwhelming.");
    }
    if (visitorProfile.experience === "repeat") {
      parts.push("Welcome back! I'll highlight what's new since your last visit including fresh launches and price movements.");
    }

    const matchedBudgetIdea = investmentIdeas.find((idea) => lowered.includes(idea.label.toLowerCase()));
    if (matchedBudgetIdea) {
      parts.push(`${matchedBudgetIdea.label}: ${matchedBudgetIdea.ideas}`);
    } else if (!budgetValue) {
      parts.push(
        "Quick budget cheat sheet:\n" +
          investmentIdeas.map((idea) => `${idea.label}: ${idea.ideas}`).join("\n")
      );
    }

    const leadQuestion = getNextLeadQuestion(updatedLead);
    if (leadQuestion) {
      parts.push(leadQuestion);
    } else {
      parts.push("Thanks for sharing every detail. Our senior advisor will reach out shortly with tailored listings.");
    }

    return { reply: parts.filter(Boolean).join("\n\n"), updatedLead };
  };

  const mergeLeadInfo = (message: string, lead: LeadInfo): LeadInfo => {
    const updated = { ...lead };
    const detectedName = detectName(message);
    if (detectedName && !updated.name) {
      updated.name = detectedName;
    }
    const detectedPhone = detectPhone(message);
    if (detectedPhone && !updated.phone) {
      updated.phone = detectedPhone;
    }
    const budgetValue = extractBudgetValue(message);
    if (budgetValue && !updated.budget) {
      updated.budget = `AED ${budgetValue.toLocaleString()}`;
    }
    const detectedLocationList = detectLocations(message);
    if (detectedLocationList.length) {
      const merged = new Set([...updated.locations, ...detectedLocationList.map((loc) => loc.toUpperCase())]);
      updated.locations = Array.from(merged);
    }
    return updated;
  };

  // Check if current page should hide chatbot
  const hiddenPages = ['/about', '/blog', '/contact'];
  const isHiddenPage = hiddenPages.some(page => location.pathname.startsWith(page));
  
  // Hide chatbot if: on hidden pages, in footer, or image is zoomed
  const shouldHideChatbot = isHiddenPage || isInFooter || isImageZoomed;

  return (
    <>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: #cbd5e1; }
          50% { border-color: #1D74B8; }
        }
      `}</style>
      {showProactivePrompt && !isOpen && !shouldHideChatbot && (
        <div className="fixed bottom-28 right-4 z-40 w-80 rounded-3xl border border-slate-200 bg-white shadow-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Hi! 👋 Looking for your dream property?</p>
              <p className="text-xs text-slate-500">
                I'm TRUE NESTER's concierge. 65% faster responses, 60% more qualified leads. How can I help?
              </p>
            </div>
            <button onClick={dismissPopup} className="text-slate-400 hover:text-slate-900">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={`popup-${action.id}`}
                onClick={() => handlePopupIntentSelect(action)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-900 hover:border-[#1D74B8]"
              >
                {action.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Shows once per session • Close anytime • No spam alerts
          </p>
        </div>
      )}
      <div 
        className={`fixed bottom-4 right-4 z-50 flex flex-col items-end transition-opacity duration-300 ${shouldHideChatbot ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        data-chatbot-button
      >
        {isOpen && (
          <div
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[480px] bg-white border border-[#e0e0e0] shadow-xl rounded-[16px] overflow-hidden transition-all duration-300"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)" }}
          >
          <div className="flex items-center justify-between px-6 py-4" style={{ background: `linear-gradient(135deg, ${brand.blue}, ${brand.green})` }}>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/80">TRUE NESTER</p>
              <p className="text-white font-semibold leading-tight">Dubai Real Estate Concierge</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 h-96 overflow-y-auto space-y-4 bg-slate-50/70">
            {!showMainMenu && leadStep === "idle" && (
              <button
                onClick={handleBackToMenu}
                className="ml-auto mb-2 text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900"
              >
                ⟵ Back to quick actions
              </button>
            )}
            {autoOffer && (
              <div className="rounded-2xl border border-dashed border-[#1D74B8]/40 bg-white p-4 text-sm text-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{autoOffer.title}</p>
                    <p className="text-xs text-slate-500">{autoOffer.description}</p>
                  </div>
                  <button onClick={() => setAutoOffer(null)} className="text-slate-400 hover:text-slate-900">
                    <X size={14} />
                  </button>
                </div>
                {autoOffer.cta && (
                  <button
                    className="mt-3 w-full rounded-xl bg-[#1D74B8] text-white px-3 py-2 text-xs font-semibold"
                    onClick={() => autoOffer?.cta && handleCTAAction(autoOffer.cta)}
                  >
                    {autoOffer.cta.label}
                  </button>
                )}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-transform duration-300 ${
                    message.sender === "user"
                      ? "bg-white text-slate-900 border border-slate-200"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.cards && (
                    <div className="mt-3 space-y-3">
                      {message.cards.map((card) => (
                        <div
                          key={card.id}
                          className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow border border-slate-100"
                        >
                          <div className="h-40 relative overflow-hidden">
                            <img 
                              src={card.image} 
                              alt={card.title}
                              className="w-full h-full object-cover"
                              onLoad={() => console.log(`[CHATBOT] Image loaded successfully: ${card.image}`)}
                              onError={(e) => {
                                console.warn(`[CHATBOT] Failed to load property image: ${card.image}`);
                                e.currentTarget.src = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=60";
                              }}
                            />
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-900">{card.title}</p>
                              <span className="text-xs font-semibold text-[#1D74B8]">{card.priceDisplay}</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {card.area} • 🛏️ {card.bedrooms} • 🚿 {card.baths} • 📐 {card.size}
                            </p>
                            <p className="text-xs text-slate-600">
                              {card.highlights.slice(0, 2).join(" • ")}
                            </p>
                            {card.availability && (
                              <p className="text-xs font-semibold text-red-500">{card.availability}</p>
                            )}
                            {card.incentives && (
                              <p className="text-xs font-medium text-emerald-600">{card.incentives}</p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {card.badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="text-[10px] uppercase tracking-widest bg-slate-900 text-white/80 rounded-full px-2 py-1"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                onClick={() => handleCTAAction({ id: `view-${card.id}`, label: "View", action: "view-details" }, card)}
                                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 hover:border-slate-400"
                              >
                                🏠 View Details
                              </button>
                              <button
                                onClick={() => handleCTAAction({ id: `save-${card.id}`, label: "Save", action: "save-property" }, card)}
                                className="flex-1 rounded-xl bg-[#1D74B8] text-white px-3 py-2 text-xs font-semibold"
                              >
                                ✅ Save Property
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.ctas && !message.cards && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.ctas.map((cta) => (
                        <button
                          key={cta.id}
                          onClick={() => handleCTAAction(cta)}
                          className="rounded-2xl bg-[#1D74B8] text-white border border-[#1D74B8] px-3 py-2 text-xs font-semibold hover:bg-[#165a91] transition-colors"
                        >
                          {cta.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.offers && (
                    <div className="mt-3 space-y-2">
                      {message.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs"
                        >
                          <p className="font-semibold text-slate-900">{offer.title}</p>
                          <p className="text-slate-600">{offer.description}</p>
                          {offer.urgency && <p className="text-amber-600 font-semibold mt-1">{offer.urgency}</p>}
                          {offer.cta && (
                            <button
                              onClick={() => handleCTAAction(offer.cta)}
                              className="mt-2 rounded-xl bg-[#1D74B8] text-white px-3 py-1 text-xs font-semibold"
                            >
                              {offer.cta.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] uppercase tracking-widest mt-2 block opacity-70 text-right">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {showMainMenu && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-900">What brings you here today?</p>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickActionSelect(action)}
                      className="rounded-2xl p-3 text-left text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
                      style={{
                        backgroundColor: action.variant === "primary" ? brand.green : brand.blue,
                      }}
                    >
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs text-white/80 leading-snug">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!showMainMenu && activeFlowId && activeStepId && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Select an option</p>
                {(() => {
                  const currentStep = getCurrentStep();
                  const isRentAreaStep = activeFlowId === "rent" && currentStep?.id === "rent-area";
                  const isRentBudgetStep = activeFlowId === "rent" && currentStep?.id === "rent-budget";
                  const isRentPropertyStep = activeFlowId === "rent" && currentStep?.id === "rent-property";
                  const gridClass = isRentAreaStep
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    : isRentBudgetStep
                      ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-[10px] lg:grid-cols-4 lg:gap-3"
                      : isRentPropertyStep
                        ? "grid grid-cols-2 sm:grid-cols-3 gap-2"
                        : "grid grid-cols-2 gap-2";

                  return (
                    <div className={gridClass}>
                      {(currentStep?.options || []).map((option) => {
                        const selectedLabel = currentStep?.id ? stepSelections[currentStep.id] : undefined;
                        const isSelected = selectedLabel === option.label;
                        const buttonClasses = (() => {
                          if (isRentAreaStep) {
                            return `rounded-full border text-sm font-medium px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#219F68]/40 ${
                              isSelected
                                ? "bg-[#219F68] text-white border-[#219F68]"
                                : "bg-[#f0f0f0] text-[#219F68] border-[#219F68] hover:bg-[#e8f5e9]"
                            }`;
                          }
                          if (isRentBudgetStep) {
                            return `rounded-[6px] border px-3 py-2 text-[13px] min-h-9 font-medium leading-snug transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D74B8]/30 ${
                              isSelected
                                ? "bg-[#1D74B8] text-white border-[#1D74B8]"
                                : "bg-[#f0f0f0] text-[#1D74B8] border-[#1D74B8] hover:bg-[#e3f2fd] hover:border-[#0D47A1]"
                            }`;
                          }
                          return "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 transition";
                        })();
                        const showCheckmark = (isRentAreaStep || isRentBudgetStep) && isSelected;

                        return (
                          <button
                            key={option.label}
                            onClick={() => handleStepOptionSelect(option)}
                            className={buttonClasses}
                          >
                            {showCheckmark && <span className="mr-1 text-xs">✓</span>}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                <span>Drafting a response…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              {leadStep === "phone" && (
                <select
                  value={leadFormValues.countryCode}
                  onChange={(e) =>
                    setLeadFormValues((prev) => ({ ...prev, countryCode: e.target.value }))
                  }
                  className="w-28 rounded-2xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D74B8]/40"
                >
                  {countryCodes.map((code) => (
                    <option key={code.label} value={code.label}>
                      {code.flag} {code.label}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative flex-1">
                <input
                  type={leadStep === "email" ? "email" : leadStep === "phone" ? "tel" : "text"}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                  placeholder={
                    leadStep === "name"
                      ? "Enter your full name..."
                      : leadStep === "email"
                      ? "Enter your email address..."
                      : leadStep === "phone"
                      ? "Enter your phone number..."
                      : "Ask about budgets, areas, or yields…"
                  }
                  autoFocus={leadStep === "phone"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D74B8]/40 pr-10 animate-pulse-border"
                  style={{ animation: leadStep === "phone" ? "pulse-border 2s infinite" : "none" }}
                />
                <button
                  onClick={handleSend}
                  className="absolute right-1 top-1 p-1.5 rounded-xl text-white shadow-sm transition-transform active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${brand.green}, ${brand.blue})` }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
            {leadError && <p className="text-xs text-red-500 mt-1 ml-1">{leadError}</p>}

            {leadStep === "idle" && (
              <>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  We collect name, phone, budget & preferred locations for tailored proposals.
                </p>
                {leadSyncStatus === "pending" && (
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    Syncing your preferences with our advisors…
                  </p>
                )}
                {leadSyncStatus === "success" && submissionCount > 0 && (
                  <p className="text-[11px] text-emerald-600 mt-1 text-center">
                    Submissions: {submissionCount}/{MAX_SUBMISSIONS} synced to admin hub ✅
                  </p>
                )}
                {submissionCount >= MAX_SUBMISSIONS && (
                  <p className="text-[11px] text-orange-600 mt-1 text-center">
                    Maximum submissions reached ({MAX_SUBMISSIONS}/{MAX_SUBMISSIONS})
                  </p>
                )}
                {leadSyncStatus === "error" && (
                  <p className="text-[11px] text-amber-600 mt-1 text-center">
                    Sync hiccup detected — auto retry in progress.
                  </p>
                )}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Profile completion</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${profileCompletion}%`, background: `linear-gradient(90deg, ${brand.green}, ${brand.blue})` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Complete profile to unlock exclusive deals & concierge support.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full shadow-2xl px-5 py-3 text-white font-semibold transition-all duration-300 hover:opacity-90"
        style={{ background: isOpen ? "#111827" : brand.green }}
      >
        <MessageCircle size={20} />
        {isOpen ? "Close" : "Chat with TRUE NESTER"}
      </button>
      </div>
    </>
  );
};

export default TrueNesterChatbot;
