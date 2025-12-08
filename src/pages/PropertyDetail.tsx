import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bed, Bath, Square, MapPin, Phone, Mail, Share2, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type React from "react";
import { useState, useEffect, useRef, TouchEvent } from "react";
import TrueNesterLogo from "@/assets/TrueNester_logo.png";
import "@/components/admin/RichTextEditorStyles.css";
import { parsePropertyTypes } from "@/lib/utils";
import { getAmenityIcon, getAmenityColor } from "@/lib/amenityIcons";

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

const SECTION_CONFIG = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details" },
  { id: "amenities", label: "Amenities" },
  { id: "location", label: "Area & Map" },
] as const;

type SectionKey = (typeof SECTION_CONFIG)[number]["id"];

type PaymentPlanRow = {
  header?: string;
  label?: string;
  stage?: string;
  milestone?: string;
  percentage?: string;
  value?: string;
  amount?: string;
  note?: string;
  date?: string;
};

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [floorPlanZoom, setFloorPlanZoom] = useState(1);
  const [floorPlanPage, setFloorPlanPage] = useState(0);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(0);
  const [floorPlanLightboxOpen, setFloorPlanLightboxOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: countryCodes[0]?.label ?? "+971",
    phone: "",
    message: "",
  });
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [activePropertyType, setActivePropertyType] = useState("");

  // Mobile swipe gallery state
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const overviewSectionRef = useRef<HTMLDivElement | null>(null);
  const detailsSectionRef = useRef<HTMLDivElement | null>(null);
  const amenitiesSectionRef = useRef<HTMLDivElement | null>(null);
  const locationSectionRef = useRef<HTMLDivElement | null>(null);
  const propertyInfoRef = useRef<HTMLDivElement | null>(null);

  const sectionAnchors = [
    { id: "overview" as const, ref: overviewSectionRef },
    { id: "details" as const, ref: detailsSectionRef },
    { id: "amenities" as const, ref: amenitiesSectionRef },
    { id: "location" as const, ref: locationSectionRef },
  ];

  // Mobile swipe handlers
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (imagesArray: string[]) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && mobileImageIndex < imagesArray.length - 1) {
      setMobileImageIndex(prev => prev + 1);
    }
    if (isRightSwipe && mobileImageIndex > 0) {
      setMobileImageIndex(prev => prev - 1);
    }
  };

  const scrollToSection = (target: SectionKey) => {
    const ref = sectionAnchors.find((section) => section.id === target)?.ref.current;
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(target);
    }
  };

  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleFloorPlanWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    setFloorPlanZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const resetZoom = () => setZoom(1);
  const resetFloorPlanZoom = () => setFloorPlanZoom(1);

  const openFloorPlanLightbox = (index: number) => {
    setSelectedFloorPlan(index);
    setFloorPlanLightboxOpen(true);
    setFloorPlanZoom(1);
  };

  const closeFloorPlanLightbox = () => {
    setFloorPlanLightboxOpen(false);
    setFloorPlanZoom(1);
  };

  const nextFloorPlan = () => {
    setSelectedFloorPlan((prev) => prev >= (property?.floor_plans?.length || 0) - 1 ? 0 : prev + 1);
  };

  const prevFloorPlan = () => {
    setSelectedFloorPlan((prev) => (prev - 1 + (property?.floor_plans?.length || 0)) % (property?.floor_plans?.length || 1));
  };
  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
      if (error) throw error;
      const propertyData = data as any;
      console.log('🏠 FRONTEND: Property data loaded:', propertyData);
      console.log('🏠 FRONTEND: Floor plans from DB:', propertyData?.floor_plans);
      console.log('🏠 FRONTEND: Floor plans type:', typeof propertyData?.floor_plans);
      console.log('🏠 FRONTEND: Floor plans is array?', Array.isArray(propertyData?.floor_plans));
      console.log('🏠 FRONTEND: Floor plans length:', propertyData?.floor_plans?.length);
      return propertyData;
    },
  });

  const images: string[] = (property?.images as string[]) ?? [];
  if (property?.featured_image) {
    if (!images.includes(property.featured_image)) images.unshift(property.featured_image);
  }

  const formatPrice = (price?: number) =>
    typeof price === "number"
      ? new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 0 }).format(price)
      : "";

  const getDisplayPrice = () => {
    const label = typeof property?.price_display === "string" ? property.price_display.trim() : "";
    if (label) return label;
    return formatPrice(property?.price ?? undefined);
  };

  const formatSizeValue = (value?: string | number | null, unit = "sqft") => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "number" ? value.toString() : value.toString().trim();
    if (!raw) return "";
    const numeric = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(numeric) && /^[0-9.,]+$/.test(raw.replace(/\s+/g, ""))) {
      return `${numeric.toLocaleString()} ${unit}`;
    }
    return raw;
  };

  const hasPaymentPlanContent = (value?: string | null) => {
    if (!value) return false;
    const stripped = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim();
    const containsMedia = /<(img|iframe|video|table)/i.test(value);
    return Boolean(stripped || containsMedia);
  };

  const formatUnitCount = (count: number | string | null | undefined) => {
    if (count === null || count === undefined) return "N/A";
    const normalized = String(count).trim();
    if (!normalized) return "N/A";
    return /^[0-9]+$/.test(normalized) ? normalized : "N/A";
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const propertyTypes = parsePropertyTypes(property?.property_type);
  const hasRichPaymentPlan = hasPaymentPlanContent(property?.payment_plan);
  const areaDisplay =
    (typeof property?.area === "string" && property.area.trim()) ||
    (typeof property?.location === "string" && property.location.trim()) ||
    property?.city ||
    "";

  useEffect(() => {
    if (property?.property_type) {
      const nextTypes = parsePropertyTypes(property.property_type);
      setActivePropertyType(nextTypes[0] || "");
    } else if (!property) {
      setActivePropertyType("");
    }
  }, [property?.property_type]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section-id") as SectionKey | null;
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 }
    );

    const targets = sectionAnchors
      .map(({ ref }) => ref.current)
      .filter((el): el is HTMLDivElement => Boolean(el));

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [property?.id]);

  const handlePropertyTypeClick = (type: string) => {
    setActivePropertyType(type);
    propertyInfoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatPropertyTypeLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

  const rawUnitTypes = Array.isArray(property?.unit_types) ? (property.unit_types as any[]) : [];
  const filteredUnitTypes = activePropertyType
    ? rawUnitTypes.filter((unit) =>
        typeof unit?.type === "string" && unit.type.toLowerCase().includes(activePropertyType.toLowerCase())
      )
    : rawUnitTypes;
  const unitTypesToDisplay = filteredUnitTypes.length > 0 ? filteredUnitTypes : rawUnitTypes;
  const showFilteredFallbackMessage = Boolean(activePropertyType) && filteredUnitTypes.length === 0 && rawUnitTypes.length > 0;
  const isFilteredUnitsView = Boolean(activePropertyType) && filteredUnitTypes.length > 0;

  const paymentPlanRows: PaymentPlanRow[] = Array.isArray(property?.payment_plan_table)
    ? (property.payment_plan_table as PaymentPlanRow[])
    : [];
  const hasStructuredPaymentPlan = paymentPlanRows.some(
    (row) => row.header || row.milestone || row.percentage || row.note || row.date
  );
  const showPaymentPlan = hasStructuredPaymentPlan || hasRichPaymentPlan;
  const shouldShowPaymentPlanSection = showPaymentPlan || Boolean(property?.handover_date);
  const propertyTypesLabel = propertyTypes.map(formatPropertyTypeLabel).join(", ");

  return (
    <Layout>
      <div className="pt-20">
        {/* Breadcrumb */}
        <section className="bg-muted/30 py-6">
          <div className="container-custom">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link to="/buy" className="hover:text-primary">Buy</Link>
              <span>/</span>
              <span className="text-foreground">Property Details</span>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container-custom">
            {isLoading && <div className="h-96 bg-muted animate-pulse rounded-2xl" />}
            {isError && <div className="text-destructive">Failed to load property.</div>}
            {property && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Image Gallery - Mobile Swipeable / Desktop Grid */}
                  <div className="relative">
                    {/* Mobile Swipeable Gallery */}
                    <div className="block lg:hidden">
                      <div 
                        className="relative h-[250px] overflow-hidden rounded-xl"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={() => onTouchEnd(images)}
                      >
                        {/* Swipeable Image */}
                        <div 
                          className="flex transition-transform duration-300 ease-out h-full"
                          style={{ transform: `translateX(-${mobileImageIndex * 100}%)` }}
                        >
                          {images.length > 0 ? images.map((img, idx) => (
                            <div key={idx} className="min-w-full h-full relative flex-shrink-0">
                              <img 
                                src={img || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"} 
                                alt={`${property.title} - ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onClick={() => openLightbox(idx)}
                              />
                            </div>
                          )) : (
                            <div className="min-w-full h-full relative flex-shrink-0">
                              <img 
                                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onClick={() => openLightbox(0)}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Logo Overlay */}
                        <img
                          src={TrueNesterLogo}
                          alt="TrueNester Logo"
                          className="absolute top-2 left-1/2 -translate-x-1/2 h-10 opacity-90 pointer-events-none select-none z-20"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                        />
                        
                        {/* Featured Badge */}
                        {property.featured && (
                          <div className="absolute top-3 left-3 z-10">
                            <span className="badge-featured text-xs px-2 py-1">Featured</span>
                          </div>
                        )}
                        
                        {/* Dot Indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {images.slice(0, Math.min(images.length, 5)).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setMobileImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === mobileImageIndex 
                                  ? 'bg-white w-4' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                          {images.length > 5 && (
                            <span className="text-white text-xs ml-1">+{images.length - 5}</span>
                          )}
                        </div>
                        
                        {/* Swipe Navigation Arrows */}
                        {mobileImageIndex > 0 && (
                          <button
                            onClick={() => setMobileImageIndex(prev => prev - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 z-10"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                        )}
                        {mobileImageIndex < images.length - 1 && (
                          <button
                            onClick={() => setMobileImageIndex(prev => prev + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 z-10"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Photo Count Badge */}
                        <button 
                          onClick={() => openLightbox(mobileImageIndex)}
                          className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span className="text-white text-xs font-medium">{images.length || 1}</span>
                        </button>
                        
                        {/* Mobile Action Buttons */}
                        <div className="absolute top-3 right-3 flex gap-2 z-20">
                          <Button 
                            size="icon"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              setShowShareMenu(!showShareMenu);
                            }}
                            className="h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white border-0"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              setIsFavorite(!isFavorite);
                            }}
                            className={`h-9 w-9 rounded-full border-0 ${
                              isFavorite 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-black/30 hover:bg-black/50 text-white'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        
                        {/* Mobile Share Menu */}
                        {showShareMenu && (
                          <div className="absolute top-14 right-3 bg-white rounded-lg shadow-2xl p-2 w-40 border border-gray-200 z-30">
                            <button
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied!');
                                setShowShareMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-xs font-medium"
                            >
                              📋 Copy Link
                            </button>
                            <button
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
                                setShowShareMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-xs font-medium"
                            >
                              💬 WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Grid Gallery */}
                    <div className="hidden lg:block">
                      <div className="flex gap-2 h-[600px]">
                        {/* Main Large Image - Left Side */}
                        <div className="flex-[70] relative cursor-pointer rounded-l-xl overflow-hidden group" onClick={() => openLightbox(0)}>
                          <img 
                            src={images[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop"} 
                            alt={property.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <img
                            src={TrueNesterLogo}
                            alt="TrueNester Logo"
                            className="absolute top-2 left-1/2 -translate-x-1/2 h-14 opacity-100 pointer-events-none select-none z-20"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                          />
                          {property.featured && (
                            <div className="absolute top-4 left-4 z-10">
                              <span className="badge-featured">Featured</span>
                            </div>
                          )}
                          
                          {/* Photo Count Badge on Main Image */}
                          <button 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              openLightbox(0);
                            }}
                            className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-white transition-colors z-10"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span className="font-semibold text-gray-900">{images.length || 1} Photos</span>
                          </button>
                        </div>

                        {/* Right Side - Stacked Images */}
                        <div className="flex-[30] flex flex-col gap-2">
                          {/* Top Image - Only show if we have more than 1 image */}
                          {images.length > 1 && (
                            <div className="flex-1 relative cursor-pointer rounded-tr-xl overflow-hidden group" onClick={() => openLightbox(1)}>
                              <img 
                                src={images[1]} 
                                alt={`${property.title} - 2`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                            </div>
                          )}

                          {/* Bottom Image with Photo Count Overlay - Only show if we have more than 2 images */}
                          {images.length > 2 && (
                            <div className="flex-1 relative cursor-pointer rounded-br-xl overflow-hidden group" onClick={() => openLightbox(2)}>
                              <img 
                                src={images[2]} 
                                alt={`${property.title} - 3`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                              {images.length > 3 && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-white text-3xl font-bold">+{images.length - 3} Photos</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-3 z-20">
                        {/* Share Button */}
                        <div className="relative">
                          <Button 
                            size="icon" 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              setShowShareMenu(!showShareMenu);
                            }}
                            className="h-12 w-12 rounded-full bg-transparent hover:bg-primary hover:text-white shadow-lg transition-all duration-300 hover:scale-110"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                          
                          {/* Share Dropdown Menu */}
                          {showShareMenu && (
                            <div className="absolute top-14 right-0 bg-white rounded-lg shadow-2xl p-3 w-48 border border-gray-200 z-30">
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(window.location.href);
                                  alert('Link copied to clipboard!');
                                  setShowShareMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
                              >
                                📋 Copy Link
                              </button>
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
                                  setShowShareMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
                              >
                                💬 WhatsApp
                              </button>
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                                  setShowShareMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
                              >
                                📘 Facebook
                              </button>
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  window.open(`mailto:?subject=Check out this property&body=${encodeURIComponent(window.location.href)}`, '_blank');
                                  setShowShareMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
                              >
                                📧 Email
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Favorite Button */}
                        <Button 
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                          }}
                          className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                            isFavorite 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-transparent hover:bg-primary hover:text-white'
                          }`}
                        >
                          <Heart className={`h-5 w-5 transition-all ${isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div ref={propertyInfoRef}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        {property.developer && property.purpose === 'sale' && (
                          <p className="text-sm text-primary font-semibold mb-2">{property.developer}</p>
                        )}
                        <h1 className="text-3xl font-bold mb-2 font-heading">{property.title}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {areaDisplay}
                        </p>
                        {propertyTypes.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {propertyTypes.map((type) => {
                              const label = formatPropertyTypeLabel(type);
                              return (
                                <span
                                  key={type}
                                  className="px-3 py-1 text-xs font-semibold rounded-full border bg-primary text-white border-primary"
                                >
                                  {label || type}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">{getDisplayPrice()}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 py-6 border-y">
                      {property.bedrooms && (
                        <div className="flex items-center gap-2">
                          <Bed className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-sm text-muted-foreground">Bedrooms</div>
                            <div className="font-semibold">{property.bedrooms}</div>
                          </div>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-2">
                          <Bath className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-sm text-muted-foreground">Bathrooms</div>
                            <div className="font-semibold">{property.bathrooms}</div>
                          </div>
                        </div>
                      )}
                      {property.size_sqft && (
                        <div className="flex items-center gap-2">
                          <Square className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-sm text-muted-foreground">Size</div>
                            <div className="font-semibold">{formatSizeValue(property.size_sqft)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Navigation */}
                  <div className="py-6">
                    <div className="sticky top-20 z-20 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-full px-3 py-2 shadow-sm">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {SECTION_CONFIG.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => scrollToSection(section.id)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${
                              activeSection === section.id
                                ? "bg-primary text-white shadow"
                                : "text-gray-600 hover:text-primary"
                            }`}
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div
                      ref={overviewSectionRef}
                      data-section-id="overview"
                      id="overview"
                      className="scroll-mt-32"
                    >
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold mb-4">Description</h3>
                          <div 
                            className="property-description text-gray-900"
                            dangerouslySetInnerHTML={{ __html: property.description || '' }}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div
                      ref={detailsSectionRef}
                      data-section-id="details"
                      id="details"
                      className="scroll-mt-32"
                    >
                      <Card>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {propertyTypesLabel && (
                            <div>
                              <p className="text-sm text-muted-foreground">Property Type</p>
                              <p className="font-semibold">{propertyTypesLabel}</p>
                            </div>
                          )}
                          {property.furnished && (
                            <div>
                              <p className="text-sm text-muted-foreground">Furnishing</p>
                              <p className="font-semibold">{property.furnished}</p>
                            </div>
                          )}
                          {property.completion_status && property.purpose === 'sale' && (
                            <div>
                              <p className="text-sm text-muted-foreground">Completion</p>
                              <p className="font-semibold">{property.completion_status}</p>
                            </div>
                          )}
                          {property.parking_spaces && (
                            <div>
                              <p className="text-sm text-muted-foreground">Parking</p>
                              <p className="font-semibold">{property.parking_spaces} Spaces</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div
                      ref={amenitiesSectionRef}
                      data-section-id="amenities"
                      id="amenities"
                      className="scroll-mt-32"
                    >
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold mb-6">Features / Amenities</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {(property.amenities || []).slice(0, 5).map((amenity: string, i: number) => {
                              const Icon = getAmenityIcon(amenity);
                              const colorClass = getAmenityColor(amenity);
                              return (
                                <div 
                                  key={i} 
                                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center gap-3"
                                >
                                  <Icon className={`w-8 h-8 ${colorClass}`} />
                                  <span className="text-sm font-medium text-gray-700 leading-tight">
                                    {amenity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {(property.amenities || []).length > 5 && (
                            <div className="mt-4 text-center">
                              <Button 
                                onClick={() => setShowAllAmenities(true)}
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
                                +{(property.amenities || []).length - 5} more amenities
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div
                      ref={locationSectionRef}
                      data-section-id="location"
                      id="location"
                      className="scroll-mt-32"
                    >
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold mb-4">Area & Map</h3>
                          {property.location && property.location.includes('maps.') ? (
                            <div className="w-full h-96 rounded-lg overflow-hidden mb-4">
                              <iframe
                                src={property.location.includes('embed') 
                                  ? property.location 
                                  : `https://www.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Property Location"
                              />
                            </div>
                          ) : property.location && (property.location.includes('http') || property.location.includes('goo.gl')) ? (
                            <div className="w-full h-96 rounded-lg overflow-hidden mb-4">
                              <iframe
                                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d55.2!3d25.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(property.location)}!5e0!3m2!1sen!2sae!4v1`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Property Location"
                              />
                              <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">View on Google Maps:</p>
                                <a 
                                  href={property.location} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline break-all"
                                >
                                  {property.location}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-96 rounded-lg overflow-hidden mb-4">
                              <iframe
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(property.location + ', UAE')}`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Property Location"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="font-medium">{areaDisplay}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Property Information Section */}
                  {(property.property_type || (property.purpose === 'sale' && (property.plot_area || property.building_description)) || rawUnitTypes.length > 0) && (
                    <div className="mt-8">
                      <Card className="overflow-hidden border-2 border-[#d4edda]">
                        <CardContent className="p-0">
                          {/* Property Type, Plot Area, Building Description - Hide plot/building for rentals */}
                          <div className="bg-[#e8f5e9] text-gray-800">
                            {property.property_type && (
                              <div className="border-b border-[#c8e6c9] p-4">
                                <h3 className="text-sm font-semibold tracking-wider mb-1 text-[#2e7d32]">PROPERTY TYPE</h3>
                                <p className="text-sm font-medium uppercase text-gray-700">{property.property_type}</p>
                              </div>
                            )}
                            {property.plot_area && property.purpose === 'sale' && (
                              <div className="border-b border-[#c8e6c9] p-4">
                                <h3 className="text-sm font-semibold tracking-wider mb-1 bg-[#c8e6c9] inline-block px-2 py-0.5 rounded text-[#2e7d32]">PLOT AREA</h3>
                                <p className="text-sm font-medium mt-1 text-gray-700">{property.plot_area}</p>
                              </div>
                            )}
                            {property.building_description && property.purpose === 'sale' && (
                              <div className="p-4">
                                <h3 className="text-sm font-semibold tracking-wider mb-1 bg-[#c8e6c9] inline-block px-2 py-0.5 rounded text-[#2e7d32]">BUILDING DESCRIPTION</h3>
                                <p className="text-sm font-medium mt-1 text-gray-700">{property.building_description}</p>
                              </div>
                            )}
                          </div>

                          {/* Units Table */}
                          {unitTypesToDisplay.length > 0 && (
                            <div className="bg-[#e8f5e9] text-gray-800 border-t-2 border-[#c8e6c9]">
                              <div className="p-4">
                                <div className="flex items-center gap-4 border-b border-[#c8e6c9] pb-3 mb-3">
                                  <span className="text-sm font-semibold tracking-wider text-[#2e7d32]">UNITS</span>
                                  <span className="text-sm font-semibold tracking-wider uppercase text-[#2e7d32]">
                                    {activePropertyType
                                      ? formatPropertyTypeLabel(activePropertyType)
                                      : propertyTypesLabel || "RESIDENTIAL"}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {unitTypesToDisplay.map((unit: { count: number | string; type: string }, index: number) => (
                                    <div key={index} className="flex items-center gap-4">
                                      <span className="text-xl font-bold w-14 text-[#2e7d32]">{formatUnitCount(unit.count)}</span>
                                      <span className="text-sm font-medium text-gray-600">{unit.type}</span>
                                    </div>
                                  ))}
                                  {showFilteredFallbackMessage && (
                                    <p className="text-xs font-semibold text-[#2e7d32]">
                                      No units available yet for {formatPropertyTypeLabel(activePropertyType)}. Showing all unit types instead.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Payment Plan & Handover Section - Only for Sale Properties */}
                  {shouldShowPaymentPlanSection && property.purpose === 'sale' && (
                    <div className="mt-8">
                      <Card className="border-2 border-primary/20 shadow-lg">
                        <CardContent className="p-8">
                          <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                              PAYMENT PLAN & HANDOVER
                            </h2>
                            <div className="h-1 w-32 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full"></div>
                          </div>

                          {showPaymentPlan && property?.payment_plan && (
                            <div className="mb-8 space-y-4">
                              <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                Payment Plan
                              </h3>
                              {hasStructuredPaymentPlan ? (
                                <div className="rounded-2xl overflow-hidden border-2 border-black shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                                  <div className="bg-black text-white text-xs tracking-[0.3em] font-semibold uppercase px-6 py-4 border-b border-white/10">
                                    PAYMENT SCHEDULE
                                  </div>
                                  <div className="bg-[#050505] text-white overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="text-xs uppercase tracking-[0.2em] text-white/70">
                                          <th className="py-4 px-6 text-left">Stage</th>
                                          <th className="py-4 px-6 text-left">Milestone</th>
                                          <th className="py-4 px-6 text-right">Payment</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {paymentPlanRows.map((row, index) => {
                                          const stageLabel = row.header || row.stage || row.label || row.milestone || `Stage ${index + 1}`;
                                          const milestone = row.milestone || row.note || row.date || "Scheduled";
                                          const paymentValue = row.value || row.amount || row.percentage || "—";
                                          const supplemental = row.note && row.note !== milestone ? row.note : row.date;
                                          return (
                                            <tr key={`${stageLabel}-${index}`} className="border-t border-white/10">
                                              <td className="py-4 px-6 font-semibold">{stageLabel}</td>
                                              <td className="py-4 px-6 text-sm">
                                                <p className="font-medium">{milestone}</p>
                                                {supplemental && (
                                                  <p className="text-white/60 text-xs mt-1">{supplemental}</p>
                                                )}
                                              </td>
                                              <td className="py-4 px-6 text-right font-semibold text-primary/90">
                                                {paymentValue}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
                                  <div
                                    className="property-description prose prose-sm max-w-none text-base text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: property.payment_plan }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {property.handover_date && (
                            <div>
                              <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                Handover Date
                              </h3>
                              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
                                <p className="text-2xl font-bold text-primary">
                                  {property.handover_date}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Floor Plans Section - Only for Sale Properties */}
                  {(() => {
                    console.log('Checking floor plans condition:', {
                      exists: !!property.floor_plans,
                      isArray: Array.isArray(property.floor_plans),
                      length: property.floor_plans?.length,
                      data: property.floor_plans
                    });
                    return property.floor_plans && Array.isArray(property.floor_plans) && property.floor_plans.length > 0 && property.purpose === 'sale';
                  })() && (
                    <div className="mt-8">
                      <Card>
                        <CardContent className="p-8">
                          <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                              Floorplans
                            </h2>
                            <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
                          </div>
                          
                          {/* Floor Plans Grid - 4 columns */}
                          <div className="relative">
                            {property.floor_plans.length > 4 && (
                              <div className="flex items-center justify-between mb-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFloorPlanPage(Math.max(0, floorPlanPage - 1))}
                                  disabled={floorPlanPage === 0}
                                  className="h-10 w-10"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  Page {floorPlanPage + 1} of {Math.ceil(property.floor_plans.length / 4)}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFloorPlanPage(Math.min(Math.ceil(property.floor_plans.length / 4) - 1, floorPlanPage + 1))}
                                  disabled={floorPlanPage >= Math.ceil(property.floor_plans.length / 4) - 1}
                                  className="h-10 w-10"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {property.floor_plans
                                .slice(floorPlanPage * 4, (floorPlanPage + 1) * 4)
                                .map((plan: any, index: number) => {
                                  const absoluteIndex = floorPlanPage * 4 + index;
                                  return (
                                    <div
                                      key={absoluteIndex}
                                      onClick={() => openFloorPlanLightbox(absoluteIndex)}
                                      className="group cursor-pointer flex flex-col"
                                    >
                                      <div className="relative w-full bg-muted rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl">
                                        {plan.image ? (
                                          <img
                                            src={plan.image}
                                            alt={plan.title}
                                            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                              e.currentTarget.src = 'https://placehold.co/400x500?text=Floor+Plan';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full aspect-[3/4] flex items-center justify-center text-muted-foreground">
                                            <span className="text-xs">No Image</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Plan Details Below Image */}
                                      <div className="mt-4 text-center">
                                        <h3 className="font-bold text-primary text-base mb-2 group-hover:text-primary/80 transition-colors">
                                          {plan.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          {plan.size}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Pagination dots */}
                            {property.floor_plans.length > 4 && (
                              <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: Math.ceil(property.floor_plans.length / 4) }).map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setFloorPlanPage(idx)}
                                    className={`h-2 rounded-full transition-all ${
                                      idx === floorPlanPage
                                        ? 'w-8 bg-primary'
                                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-6">Interested in this property?</h3>
                      
                      {formSubmitted ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-green-700 mb-2">Form Submitted Successfully!</h4>
                          <p className="text-muted-foreground">True Nester's agent will reach out to you shortly.</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {
                              setFormSubmitted(false);
                              setFormData({
                                name: '',
                                email: '',
                                countryCode: countryCodes[0]?.label ?? '+971',
                                phone: '',
                                message: ''
                              });
                            }}
                          >
                            Submit Another Inquiry
                          </Button>
                        </div>
                      ) : (
                        <form 
                          className="space-y-4"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setFormSubmitting(true);
                            setFormError('');
                            
                            try {
                              // Generate a proper UUID for customer_id
                              const generateUUID = () => {
                                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                                  const r = Math.random() * 16 | 0;
                                  const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                  return v.toString(16);
                                });
                              };
                              
                              // Save inquiry to Supabase conversations table (visible in Admin Panel)
                              const { error: dbError } = await supabase
                                .from('conversations')
                                .insert({
                                  customer_id: generateUUID(),
                                  customer_name: formData.name,
                                  customer_email: formData.email,
                                  customer_phone: formData.phone,
                                  start_time: new Date().toISOString(),
                                  status: 'new',
                                  intent: 'property_inquiry',
                                  notes: `Property: ${property.title}\nURL: ${window.location.href}\nMessage: ${formData.message || 'No message provided'}`,
                                  preferred_area: property.area || property.location || null,
                                  property_type: property.property_type || null
                                });
                              
                              if (dbError) {
                                console.error('DB Error:', dbError);
                                throw new Error('Failed to save inquiry');
                              }
                              
                              // Send to Slack webhook for property inquiry
                              const slackWebhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
                              if (slackWebhookUrl) {
                                try {
                                  console.log("Sending property inquiry to Slack...");
                                  await fetch(slackWebhookUrl, {
                                    method: "POST",
                                    mode: "no-cors",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      text: `🏠 New Property Inquiry`,
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
                                            { type: "mrkdwn", text: `*Name:*\n${formData.name}` },
                                            { type: "mrkdwn", text: `*Property:*\n${property.title}` },
                                            { type: "mrkdwn", text: `*Email:*\n${formData.email}` },
                                            { type: "mrkdwn", text: `*Phone:*\n${formData.countryCode} ${formData.phone}` },
                                          ],
                                        },
                                        {
                                          type: "section",
                                          text: {
                                            type: "mrkdwn",
                                            text: `*Message:*\n${formData.message || "No message provided"}`,
                                          },
                                        },
                                        {
                                          type: "actions",
                                          elements: [
                                            {
                                              type: "button",
                                              text: {
                                                type: "plain_text",
                                                text: "View Property",
                                                emoji: true,
                                              },
                                              url: window.location.href,
                                              style: "primary",
                                            },
                                            {
                                              type: "button",
                                              text: {
                                                type: "plain_text",
                                                text: "View in Admin",
                                              },
                                              url: `${window.location.origin}/admin/conversations`,
                                            },
                                          ],
                                        },
                                      ],
                                    }),
                                  });
                                  console.log("Property inquiry sent to Slack");
                                } catch (slackError) {
                                  console.warn("Failed to send property inquiry to Slack:", slackError);
                                  // Don't fail the form submission if Slack fails
                                }
                              }
                              
                              // Send email notification via Edge Function (runs in background)
                              supabase.functions.invoke('send-inquiry-email', {
                                body: {
                                  customerName: formData.name,
                                  customerEmail: formData.email,
                                  customerPhone: formData.phone,
                                  propertyTitle: property.title,
                                  propertyUrl: window.location.href,
                                  message: formData.message || ''
                                }
                              }).catch(err => console.log('Email notification error:', err));
                              
                              setFormSubmitted(true);
                              setFormData({
                                name: '',
                                email: '',
                                countryCode: countryCodes[0]?.label ?? '+971',
                                phone: '',
                                message: ''
                              });
                            } catch (err) {
                              console.error('Form submission error:', err);
                              setFormError('Failed to submit. Please try again or contact us directly.');
                            } finally {
                              setFormSubmitting(false);
                            }
                          }}
                        >
                          <div>
                            <Input 
                              placeholder="Your Name" 
                              required 
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Input 
                              type="email" 
                              placeholder="Email Address" 
                              required 
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={formData.countryCode}
                              onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                              className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {countryCodes.map((code) => (
                                <option key={code.label} value={code.label}>
                                  {code.flag} {code.label}
                                </option>
                              ))}
                            </select>
                            <Input 
                              type="tel" 
                              placeholder="Phone Number" 
                              required 
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="flex-1"
                            />
                          </div>
                          <div>
                            <Textarea 
                              placeholder="Your Message" 
                              rows={4} 
                              value={formData.message}
                              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            />
                          </div>
                          {formError && (
                            <p className="text-red-500 text-sm">{formError}</p>
                          )}
                          <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={formSubmitting}
                          >
                            {formSubmitting ? 'Submitting...' : 'Request Callback'}
                          </Button>
                          <div className="pt-4 text-sm text-muted-foreground">
                            Or contact us directly:
                            <div className="flex flex-col gap-2 mt-2">
                              <a href="tel:+971501234567" className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Phone className="h-4 w-4" /> +971 50 123 4567
                              </a>
                              <a href="mailto:info@truenester.com" className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Mail className="h-4 w-4" /> info@truenester.com
                              </a>
                            </div>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" 
            onWheel={handleWheelZoom}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setTouchStart(touch.clientX);
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              setTouchEnd(touch.clientX);
              if (!touchStart || !touch.clientX) return;
              const distance = touchStart - touch.clientX;
              const minDistance = 50;
              
              if (Math.abs(distance) > minDistance) {
                if (distance > 0 && currentImageIndex < images.length - 1) {
                  nextImage();
                } else if (distance < 0 && currentImageIndex > 0) {
                  prevImage();
                }
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full"
              aria-label="Close"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 text-white bg-black/60 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold">
              {currentImageIndex + 1} / {images.length || 1}
            </div>

            {/* Previous Button - Responsive */}
            <button
              onClick={prevImage}
              className="absolute left-1 sm:left-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full active:scale-90 transform transition-transform"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6 sm:h-10 sm:w-10" />
            </button>

            {/* Next Button - Responsive */}
            <button
              onClick={nextImage}
              className="absolute right-1 sm:right-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full active:scale-90 transform transition-transform"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6 sm:h-10 sm:w-10" />
            </button>

            {/* Current Image with Zoom & Watermark */}
            <div className="w-full h-full flex items-center justify-center select-none" onDoubleClick={resetZoom}>
              <div className="relative flex items-center justify-center max-h-full max-w-full">
                <img
                  src={images[currentImageIndex] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop"}
                  alt={`${property?.title || "Property"} - Image ${currentImageIndex + 1}`}
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
                  className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[80vh] object-contain rounded-lg"
                  draggable={false}
                />
                <img
                  src={TrueNesterLogo}
                  alt="TrueNester Logo"
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 h-12 sm:h-16 opacity-20 pointer-events-none"
                  draggable={false}
                />
                {zoom > 1 && (
                  <div className="absolute bottom-2 left-2 text-[10px] sm:text-xs bg-black/60 text-white px-2 py-1 rounded-md font-semibold">
                    Zoom: {Math.round(zoom * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hint for Swipe */}
            <div className="absolute bottom-2 sm:hidden text-white text-xs text-center bg-black/40 px-3 py-1 rounded-full">
              Swipe to navigate • Double tap to zoom
            </div>
          </div>
        )}

        {/* Floor Plan Lightbox Modal */}
        {floorPlanLightboxOpen && property?.floor_plans && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" 
            onWheel={handleFloorPlanWheel}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setTouchStart(touch.clientX);
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              setTouchEnd(touch.clientX);
              if (!touchStart || !touch.clientX) return;
              const distance = touchStart - touch.clientX;
              const minDistance = 50;
              
              if (Math.abs(distance) > minDistance && property.floor_plans.length > 1) {
                if (distance > 0 && selectedFloorPlan < property.floor_plans.length - 1) {
                  nextFloorPlan();
                } else if (distance < 0 && selectedFloorPlan > 0) {
                  prevFloorPlan();
                }
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeFloorPlanLightbox}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full"
              aria-label="Close"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Floor Plan Title - Responsive */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 text-white bg-black/60 px-2 sm:px-4 py-1 sm:py-2 rounded-md max-w-[60vw] sm:max-w-none">
              <div className="text-sm sm:text-lg font-bold truncate">{property.floor_plans[selectedFloorPlan]?.title}</div>
              <div className="text-xs sm:text-sm text-gray-300 truncate">{property.floor_plans[selectedFloorPlan]?.size}</div>
            </div>

            {/* Plan Counter - Responsive */}
            <div className="absolute top-16 sm:top-20 left-2 sm:left-4 z-50 text-white bg-black/60 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold">
              {selectedFloorPlan + 1} / {property.floor_plans.length}
            </div>

            {/* Previous Button */}
            {property.floor_plans.length > 1 && (
              <button
                onClick={prevFloorPlan}
                className="absolute left-1 sm:left-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full active:scale-90 transform transition-transform"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6 sm:h-10 sm:w-10" />
              </button>
            )}

            {/* Next Button */}
            {property.floor_plans.length > 1 && (
              <button
                onClick={nextFloorPlan}
                className="absolute right-1 sm:right-4 z-50 text-white hover:text-gray-300 transition-colors p-1 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full active:scale-90 transform transition-transform"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6 sm:h-10 sm:w-10" />
              </button>
            )}

            {/* Current Floor Plan with Zoom */}
            <div className="w-full h-full flex items-center justify-center select-none" onDoubleClick={resetFloorPlanZoom}>
              <div className="relative flex items-center justify-center max-h-full max-w-full">
                <img
                  src={property.floor_plans[selectedFloorPlan]?.image || "https://placehold.co/600x400?text=Floor+Plan+Not+Available"}
                  alt={property.floor_plans[selectedFloorPlan]?.title || "Floor Plan"}
                  style={{ transform: `scale(${floorPlanZoom})`, transition: 'transform 0.15s ease-out' }}
                  className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[80vh] object-contain rounded-lg"
                  draggable={false}
                  onError={(e) => {
                    console.error('Floor plan image failed to load:', property.floor_plans[selectedFloorPlan]?.image);
                    e.currentTarget.src = 'https://placehold.co/600x400?text=Floor+Plan+Not+Available';
                  }}
                />
                <img
                  src={TrueNesterLogo}
                  alt="TrueNester Logo"
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 h-12 sm:h-16 opacity-20 pointer-events-none"
                  draggable={false}
                />
                {floorPlanZoom > 1 && (
                  <div className="absolute bottom-2 left-2 text-[10px] sm:text-xs bg-black/60 text-white px-2 py-1 rounded-md font-semibold">
                    Zoom: {Math.round(floorPlanZoom * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hint for Swipe */}
            {property.floor_plans.length > 1 && (
              <div className="absolute bottom-2 sm:hidden text-white text-xs text-center bg-black/40 px-3 py-1 rounded-full">
                Swipe to navigate • Double tap to zoom
              </div>
            )}
          </div>
        )}

      {/* Amenities Modal */}
      <Dialog open={showAllAmenities} onOpenChange={setShowAllAmenities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Amenities & Features</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-4">
            {(property?.amenities || []).map((amenity: string, i: number) => {
              const Icon = getAmenityIcon(amenity);
              const colorClass = getAmenityColor(amenity);
              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center gap-3"
                >
                  <Icon className={`w-10 h-10 ${colorClass}`} />
                  <span className="text-sm font-medium text-gray-700 leading-tight">
                    {amenity}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};

export default PropertyDetail;
