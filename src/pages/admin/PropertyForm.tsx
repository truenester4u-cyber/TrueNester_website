import { useState, useEffect, useRef } from "react";
import type { DragEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Loader2, Upload, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdvancedRichTextEditor } from "@/components/admin/AdvancedRichTextEditor";
import { AmenityIconPicker } from "@/components/admin/AmenityIconPicker";
import { parsePropertyTypes } from "@/lib/utils";

interface PropertyFormData {
  title: string;
  slug: string;
  description: string;
  price: string;
  price_display: string;
  property_type: string;
  purpose: string;
  location: string;
  city: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  size_sqft: string;
  size_sqm: string;
  features: string[];
  amenities: string[];
  developer: string;
  completion_status: string;
  completion_date: string;
  furnished: string;
  parking_spaces: string;
  floor_number: string;
  building_description: string;
  plot_area: string;
  unit_types: Array<{
    count: number;
    type: string;
    price_aed?: string;
  }>;
  agent_name: string;
  agent_phone: string;
  agent_email: string;
  meta_title: string;
  meta_description: string;
  featured: boolean;
  featured_dubai: boolean;
  featured_abu_dhabi: boolean;
  featured_ras_al_khaimah: boolean;
  featured_umm_al_quwain: boolean;
  published: boolean;
  payment_plan: string;
  handover_date: string;
  floor_plans: Array<{
    title: string;
    size: string;
    image: string;
  }>;
  payment_plan_table: Array<{
    header?: string;
    milestone: string;
    percentage: string;
    note: string;
  }>;
  total_units: string;
}

const PROPERTY_TYPE_OPTIONS = [
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Penthouse", value: "penthouse" },
  { label: "Land", value: "land" },
  { label: "Commercial", value: "commercial" },
  { label: "Office", value: "office" },
  { label: "Retail", value: "retail" },
];

const PROPERTY_TYPE_LIMIT = 3;

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const draggedImageIndexRef = useRef<number | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [newFeature, setNewFeature] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [newFloorPlan, setNewFloorPlan] = useState({ title: "", size: "", image: "" });
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [newUnitType, setNewUnitType] = useState({ count: "", type: "", price_aed: "" });
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [newPaymentRow, setNewPaymentRow] = useState({ header: "", milestone: "", percentage: "", note: "" });
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [customPropertyType, setCustomPropertyType] = useState("");

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    slug: "",
    description: "",
    price: "",
    price_display: "",
    property_type: "",
    purpose: "",
    location: "",
    city: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    size_sqft: "",
    size_sqm: "",
    features: [],
    amenities: [],
    developer: "",
    completion_status: "",
    completion_date: "",
    furnished: "",
    parking_spaces: "",
    floor_number: "",
    building_description: "",
    plot_area: "",
    unit_types: [],
    agent_name: "",
    agent_phone: "",
    agent_email: "",
    meta_title: "",
    meta_description: "",
    featured: false,
    featured_dubai: false,
    featured_abu_dhabi: false,
    featured_ras_al_khaimah: false,
    featured_umm_al_quwain: false,
    published: false,
    payment_plan: "",
    handover_date: "",
    floor_plans: [],
    payment_plan_table: [],
    total_units: "",
  });

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  useEffect(() => {
    setFormData((prev) => {
      const joinedTypes = selectedPropertyTypes.join(" | ");
      if (prev.property_type === joinedTypes) {
        return prev;
      }
      return {
        ...prev,
        property_type: joinedTypes,
      };
    });
  }, [selectedPropertyTypes]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const propertyData = data as any;
        console.log('📥 ADMIN: Fetched property data:', propertyData);
        console.log('📥 ADMIN: Floor plans from DB:', propertyData.floor_plans);
        console.log('📥 ADMIN: Floor plans type:', typeof propertyData.floor_plans);
        setFormData({
          title: propertyData.title || "",
          slug: propertyData.slug || "",
          description: propertyData.description || "",
          price: propertyData.price?.toString() || "",
          price_display: propertyData.price_display || "",
          property_type: propertyData.property_type || "",
          purpose: propertyData.purpose || "",
          location: propertyData.location || "",
          city: propertyData.city || "",
          area: propertyData.area || "",
          bedrooms: propertyData.bedrooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
          size_sqft: propertyData.size_sqft?.toString() || "",
          size_sqm: propertyData.size_sqm?.toString() || "",
          features: (propertyData.features as string[]) || [],
          amenities: (propertyData.amenities as string[]) || [],
          developer: propertyData.developer || "",
          completion_status: propertyData.completion_status || "",
          completion_date: propertyData.completion_date || "",
          furnished: propertyData.furnished || "",
          parking_spaces: propertyData.parking_spaces?.toString() || "",
          floor_number: propertyData.floor_number?.toString() || "",
          building_description: propertyData.building_description || "",
          plot_area: propertyData.plot_area || "",
          unit_types: Array.isArray(propertyData.unit_types)
            ? propertyData.unit_types.map((u: any) => ({
                count: u.count,
                type: u.type,
                price_aed: u.price_aed ?? "",
              }))
            : [],
          agent_name: propertyData.agent_name || "",
          agent_phone: propertyData.agent_phone || "",
          agent_email: propertyData.agent_email || "",
          meta_title: propertyData.meta_title || "",
          meta_description: propertyData.meta_description || "",
          featured: propertyData.featured || false,
          featured_dubai: propertyData.featured_dubai || false,
          featured_abu_dhabi: propertyData.featured_abu_dhabi || false,
          featured_ras_al_khaimah: propertyData.featured_ras_al_khaimah || false,
          featured_umm_al_quwain: propertyData.featured_umm_al_quwain || false,
          published: propertyData.published || false,
          payment_plan: propertyData.payment_plan || "",
          handover_date: propertyData.handover_date || "",
          floor_plans: Array.isArray(propertyData.floor_plans) ? propertyData.floor_plans : [],
          payment_plan_table: Array.isArray(propertyData.payment_plan_table) ? propertyData.payment_plan_table : [],
          total_units: propertyData.total_units || "",
        });
        console.log('📝 ADMIN: Set floor_plans to form:', Array.isArray(propertyData.floor_plans) ? propertyData.floor_plans : []);
        setImages((propertyData.images as string[]) || []);
        setFeaturedImage(propertyData.featured_image || "");
        const parsedTypes = parsePropertyTypes(propertyData.property_type).map((type) => type.toLowerCase());
        setSelectedPropertyTypes(parsedTypes.length > 0
          ? Array.from(new Set(parsedTypes))
          : propertyData.property_type
            ? [propertyData.property_type.toLowerCase()]
            : []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const togglePropertyType = (value: string) => {
    setSelectedPropertyTypes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((type) => type !== value);
      }
      if (prev.length >= PROPERTY_TYPE_LIMIT) {
        return prev;
      }
      return [...prev, value];
    });
  };

  const addCustomPropertyType = () => {
    const normalized = customPropertyType.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setSelectedPropertyTypes((prev) => {
      if (prev.includes(normalized) || prev.length >= PROPERTY_TYPE_LIMIT) {
        return prev;
      }
      return [...prev, normalized];
    });
    setCustomPropertyType("");
  };

  const selectedPropertyTypeLabels = selectedPropertyTypes.map((value) => {
    const match = PROPERTY_TYPE_OPTIONS.find((option) => option.value === value);
    if (match) {
      return match.label;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  });

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "title" && !id) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("property-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Try signed URL first (works with private buckets); fallback to public URL
        const { data: signedData, error: signedError } = await supabase.storage
          .from("property-images")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7);

        if (!signedError && signedData?.signedUrl) {
          uploadedUrls.push(signedData.signedUrl);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("property-images")
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
      if (!featuredImage && uploadedUrls.length > 0) {
        setFeaturedImage(uploadedUrls[0]);
      }

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (featuredImage === images[index] && newImages.length > 0) {
      setFeaturedImage(newImages[0]);
    }
  };

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
    draggedImageIndexRef.current = index;
  };

  const handleImageDrop = (index: number) => {
    const fromIndex = draggedImageIndexRef.current;
    if (fromIndex === null || fromIndex === index) {
      setDraggedImageIndex(null);
      draggedImageIndexRef.current = null;
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedImageIndex(null);
    draggedImageIndexRef.current = null;
  };

  const handleImageDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    draggedImageIndexRef.current = null;
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addAmenity = (amenity?: string) => {
    const amenityToAdd = amenity || newAmenity;
    if (amenityToAdd.trim()) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityToAdd.trim()],
      }));
      if (!amenity) {
        setNewAmenity("");
      }
    }
  };

  const removeAmenity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const addFloorPlan = () => {
    if (newFloorPlan.title.trim() && newFloorPlan.size.trim() && newFloorPlan.image.trim()) {
      setFormData((prev) => ({
        ...prev,
        floor_plans: [...prev.floor_plans, { ...newFloorPlan }],
      }));
      setNewFloorPlan({ title: "", size: "", image: "" });
    }
  };

  const removeFloorPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      floor_plans: prev.floor_plans.filter((_, i) => i !== index),
    }));
  };

  const addPaymentRow = () => {
    if (newPaymentRow.milestone.trim() && newPaymentRow.percentage.trim()) {
      setFormData((prev) => ({
        ...prev,
        payment_plan_table: [...prev.payment_plan_table, { ...newPaymentRow }],
      }));
      setNewPaymentRow({ header: "", milestone: "", percentage: "", note: "" });
    }
  };

  const removePaymentRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      payment_plan_table: prev.payment_plan_table.filter((_, i) => i !== index),
    }));
  };

  const startEditingUnit = (index: number) => {
    const unit = formData.unit_types[index];
    setNewUnitType({
      count: unit.count.toString(),
      type: unit.type,
      price_aed: unit.price_aed || "",
    });
    setEditingUnitIndex(index);
  };

  const updateUnitType = () => {
    if (editingUnitIndex !== null && newUnitType.count && newUnitType.type.trim()) {
      setFormData((prev) => ({
        ...prev,
        unit_types: prev.unit_types.map((unit, idx) =>
          idx === editingUnitIndex
            ? {
                count: parseInt(newUnitType.count),
                type: newUnitType.type.trim(),
                price_aed: newUnitType.price_aed?.trim() || "",
              }
            : unit
        ),
      }));
      setNewUnitType({ count: "", type: "", price_aed: "" });
      setEditingUnitIndex(null);
    }
  };

  const cancelEditingUnit = () => {
    setNewUnitType({ count: "", type: "", price_aed: "" });
    setEditingUnitIndex(null);
  };

  const handleFloorPlanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFloorPlan(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `floorplan_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("property-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (!signedError && signedData?.signedUrl) {
        setNewFloorPlan({ ...newFloorPlan, image: signedData.signedUrl });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("property-images")
          .getPublicUrl(filePath);
        setNewFloorPlan({ ...newFloorPlan, image: publicUrl });
      }

      toast({
        title: "Success",
        description: "Floor plan image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingFloorPlan(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedPropertyTypes.length === 0) {
        toast({
          title: "Property type required",
          description: "Select at least one property type before saving.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const numericPrice = formData.price ? parseFloat(formData.price) : null;
      const propertyTypeValue = selectedPropertyTypes.join(" | ");
      const normalizeText = (value: string) => {
        const text = (value ?? "").toString().trim();
        return text || null;
      };

      const propertyData: Record<string, any> = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        price: Number.isFinite(numericPrice) ? numericPrice : null,
        price_display: formData.price_display || null,
        property_type: propertyTypeValue,
        purpose: formData.purpose,
        location: formData.location,
        city: formData.city,
        area: formData.area || null,
        bedrooms: normalizeText(formData.bedrooms),
        bathrooms: normalizeText(formData.bathrooms),
        size_sqft: normalizeText(formData.size_sqft),
        size_sqm: normalizeText(formData.size_sqm),
        features: formData.features,
        amenities: formData.amenities,
        images: images,
        featured_image: featuredImage || null,
        developer: formData.developer || null,
        completion_status: formData.completion_status || null,
        completion_date: formData.completion_date || null,
        furnished: formData.furnished || null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        building_description: formData.building_description || null,
        plot_area: formData.plot_area || null,
        unit_types: formData.unit_types,
        agent_name: formData.agent_name || null,
        agent_phone: formData.agent_phone || null,
        agent_email: formData.agent_email || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        featured: formData.featured,
        featured_dubai: formData.featured_dubai,
        featured_abu_dhabi: formData.featured_abu_dhabi,
        featured_ras_al_khaimah: formData.featured_ras_al_khaimah,
        featured_umm_al_quwain: formData.featured_umm_al_quwain,
        published: formData.published,
        payment_plan: formData.payment_plan || null,
        handover_date: formData.handover_date || null,
        floor_plans: formData.floor_plans,
        payment_plan_table: formData.payment_plan_table,
        total_units: normalizeText(formData.total_units),
      };

      console.log('💾 ADMIN: Saving property with floor_plans:', formData.floor_plans);
      console.log('💾 ADMIN: Full property data:', propertyData);
      console.log('💾 ADMIN: Floor plans array length:', formData.floor_plans.length);
      console.log('💾 ADMIN: Floor plans is array?', Array.isArray(formData.floor_plans));

      if (id) {
        const { data: savedData, error } = await supabase
          .from("properties")
          .update(propertyData as any)
          .eq("id", id)
          .select();

        if (error) {
          console.error('❌ ADMIN: Error saving:', error);
          throw error;
        }
        
        console.log('✅ ADMIN: Property saved successfully:', savedData);

        toast({
          title: "Success",
          description: "Property updated successfully",
        });
      } else {
        const { data: savedData, error } = await supabase.from("properties").insert([propertyData as any]).select();

        if (error) {
          console.error('❌ ADMIN: Error creating:', error);
          throw error;
        }
        
        console.log('✅ ADMIN: Property created successfully:', savedData);

        toast({
          title: "Success",
          description: "Property created successfully",
        });
      }

      navigate("/admin/properties");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{id ? "Edit" : "Create"} Property</h1>
          <p className="text-gray-600">Fill in the details to {id ? "update" : "add"} a property</p>
        </div>

        {/* Purpose Banner */}
        {formData.purpose === 'rent' && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <h3 className="font-semibold text-blue-900">Rental Property Mode</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This form is optimized for rental listings (like Bayut). Developer-specific fields (payment plans, floor plans, completion dates) are hidden for a cleaner experience.
                </p>
              </div>
            </div>
          </div>
        )}
        {formData.purpose === 'sale' && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🏗️</div>
              <div>
                <h3 className="font-semibold text-green-900">Sale Property Mode</h3>
                <p className="text-sm text-green-700 mt-1">
                  All fields available including developer information, payment plans, floor plans, and project details.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <AdvancedRichTextEditor
                  content={formData.description}
                  onChange={(html) => handleInputChange("description", html)}
                  placeholder="Write a detailed description for your property..."
                  minHeight="400px"
                  propertyId={id}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price_display">Display Price *</Label>
                  <Input
                    id="price_display"
                    value={formData.price_display}
                    onChange={(e) => handleInputChange("price_display", e.target.value)}
                    placeholder="e.g., Starting from AED 1.45M"
                    list="price-presets"
                    required
                  />
                  <datalist id="price-presets">
                    {["Starting from AED 1.45M","Starting from AED 650K","Starting from AED 744K","Starting from AED 1.1 Million","Starting from AED 1.82M","Starting from AED 1.71M"].map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use letters, numbers, and symbols to match marketing language (e.g., "Starting from AED 1.45M").
                  </p>
                </div>
                <div>
                  <Label>Property Types *</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select up to {PROPERTY_TYPE_LIMIT} categories so we can showcase every configuration this project offers.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {PROPERTY_TYPE_OPTIONS.map((option) => {
                      const isSelected = selectedPropertyTypes.includes(option.value);
                      const isDisabled = !isSelected && selectedPropertyTypes.length >= PROPERTY_TYPE_LIMIT;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => togglePropertyType(option.value)}
                          disabled={isDisabled}
                          className={`rounded-full px-4 py-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white border border-primary"
                              : isDisabled
                              ? "bg-gray-50 text-gray-300 border border-gray-200 cursor-not-allowed"
                              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPropertyTypeLabels.length > 0 ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing as: {selectedPropertyTypeLabels.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive mt-2">
                      Select at least one property type.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value) => handleInputChange("purpose", value)}
                  >
                    <SelectTrigger className={formData.purpose === 'rent' ? 'border-blue-500 bg-blue-50' : formData.purpose === 'sale' ? 'border-green-500 bg-green-50' : ''}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale (Show developer, payment plans, floor plans)</SelectItem>
                      <SelectItem value="rent">Rent (Simplified listing like Bayut)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.purpose === 'rent' && (
                    <p className="text-xs text-blue-600 mt-1">
                      📋 Rental mode: Developer, payment plans, floor plans, and completion fields are hidden
                    </p>
                  )}
                  {formData.purpose === 'sale' && (
                    <p className="text-xs text-green-600 mt-1">
                      🏗️ Sale mode: All developer and project fields available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange("city", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                      <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Fujairah">Fujairah</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Downtown Dubai"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="area">Area/Community</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    placeholder="e.g., Business Bay"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="text"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    placeholder="e.g., 1, 2, 1-3 BR"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="text"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                    placeholder="e.g., 2, 2.5, 1-2"
                  />
                </div>
                <div>
                  <Label htmlFor="size_sqft">Size (Sqft)</Label>
                  <Input
                    id="size_sqft"
                    type="text"
                    value={formData.size_sqft}
                    onChange={(e) => handleInputChange("size_sqft", e.target.value)}
                    placeholder="e.g., 1200, 1200-1500"
                  />
                </div>
                <div>
                  <Label htmlFor="size_sqm">Size (Sqm)</Label>
                  <Input
                    id="size_sqm"
                    type="text"
                    value={formData.size_sqm}
                    onChange={(e) => handleInputChange("size_sqm", e.target.value)}
                    placeholder="e.g., 110, 110-140"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parking_spaces">Parking Spaces</Label>
                  <Input
                    id="parking_spaces"
                    type="number"
                    value={formData.parking_spaces}
                    onChange={(e) => handleInputChange("parking_spaces", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="floor_number">Floor Number</Label>
                  <Input
                    id="floor_number"
                    type="number"
                    value={formData.floor_number}
                    onChange={(e) => handleInputChange("floor_number", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="plot_area">Plot Area</Label>
                  <Input
                    id="plot_area"
                    value={formData.plot_area}
                    onChange={(e) => handleInputChange("plot_area", e.target.value)}
                    placeholder="e.g., 2827.54 SQ.M / 30435.00 SQFT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="furnished">Furnished</Label>
                  <Select
                    value={formData.furnished}
                    onValueChange={(value) => handleInputChange("furnished", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.purpose === 'sale' && (
                  <>
                    <div>
                      <Label htmlFor="completion_status">Completion Status</Label>
                      <Select
                        value={formData.completion_status}
                        onValueChange={(value) => handleInputChange("completion_status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="off-plan">Off-Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="completion_date">Completion Date</Label>
                      <Input
                        id="completion_date"
                        type="date"
                        value={formData.completion_date}
                        onChange={(e) => handleInputChange("completion_date", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {formData.purpose === 'sale' && (
                <div>
                  <Label htmlFor="developer">Developer</Label>
                  <Input
                    id="developer"
                    value={formData.developer}
                    onChange={(e) => handleInputChange("developer", e.target.value)}
                    placeholder="e.g., Emaar Properties"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="building_description">Building Description</Label>
                <Input
                  id="building_description"
                  value={formData.building_description}
                  onChange={(e) => handleInputChange("building_description", e.target.value)}
                  placeholder="e.g., 4B + G + 16 RESIDENTIAL FLOORS + ROOF"
                />
              </div>
            </CardContent>
          </Card>

          {/* Unit Types */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="unit_count">Unit Count</Label>
                  <Input
                    id="unit_count"
                    type="text"
                    value={newUnitType.count}
                    onChange={(e) => setNewUnitType({ ...newUnitType, count: e.target.value })}
                    placeholder="e.g., 48"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_type">Unit Type</Label>
                  <Input
                    id="unit_type"
                    value={newUnitType.type}
                    onChange={(e) => setNewUnitType({ ...newUnitType, type: e.target.value })}
                    placeholder="e.g., 1-BED APT."
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price_aed">Price AED</Label>
                  <Input
                    id="unit_price_aed"
                    type="text"
                    value={newUnitType.price_aed}
                    onChange={(e) => setNewUnitType({ ...newUnitType, price_aed: e.target.value })}
                    placeholder="e.g., From AED 1.4M"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Marketing-friendly price, e.g. "From AED 1.45M".
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  {editingUnitIndex !== null ? (
                    <>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={updateUnitType}
                      >
                        Update Unit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditingUnit}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        if (newUnitType.count && newUnitType.type.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            unit_types: [
                              ...prev.unit_types,
                              {
                                count: parseInt(newUnitType.count),
                                type: newUnitType.type.trim(),
                                price_aed: newUnitType.price_aed?.trim() || "",
                              },
                            ],
                          }));
                          setNewUnitType({ count: "", type: "", price_aed: "" });
                        }
                      }}
                    >
                      Add Unit Type
                    </Button>
                  )}
                </div>
              </div>

              {formData.unit_types.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Units</th>
                          <th className="px-4 py-2 text-left font-semibold">Type</th>
                          <th className="px-4 py-2 text-left font-semibold">Price AED</th>
                          <th className="px-4 py-2 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.unit_types.map((unit, index) => (
                          <tr key={index} className={`border-t ${editingUnitIndex === index ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-2 font-semibold">{unit.count}</td>
                            <td className="px-4 py-2">{unit.type}</td>
                            <td className="px-4 py-2 text-primary font-medium">
                              {unit.price_aed || "-"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingUnit(index)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      unit_types: prev.unit_types.filter((_, i) => i !== index),
                                    }));
                                    if (editingUnitIndex === index) {
                                      cancelEditingUnit();
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="total_units">Total Units (Display Text)</Label>
                    <Input
                      id="total_units"
                      value={formData.total_units}
                      onChange={(e) => handleInputChange("total_units", e.target.value)}
                      placeholder="e.g., 156 residential units"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be shown in <strong>bold font</strong> on the website below unit types
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Upload Images</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag thumbnails to reorder. The first image is used across galleries while the featured tag controls the homepage highlight.
                </p>
                <div className="mt-2">
                  <label
                    htmlFor="images"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex flex-col items-center">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">
                            Click to upload images
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className={`relative group cursor-grab ${draggedImageIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      draggable
                      onDragStart={() => handleImageDragStart(index)}
                      onDragOver={handleImageDragOver}
                      onDrop={() => handleImageDrop(index)}
                      onDragEnd={handleImageDragEnd}
                    >
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3" />
                        Drag
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {image === featuredImage && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                          Featured
                        </span>
                      )}
                      {image !== featuredImage && (
                        <button
                          type="button"
                          onClick={() => setFeaturedImage(image)}
                          className="absolute bottom-2 left-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set as Featured
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features & Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Features</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select amenities with icons from the predefined list or add custom ones
                </p>
                <AmenityIconPicker
                  onSelect={addAmenity}
                  selectedAmenities={formData.amenities}
                  onRemove={removeAmenity}
                />
              </div>
            </CardContent>
          </Card>

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="agent_name">Agent Name</Label>
                  <Input
                    id="agent_name"
                    value={formData.agent_name}
                    onChange={(e) => handleInputChange("agent_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agent_phone">Agent Phone</Label>
                  <Input
                    id="agent_phone"
                    value={formData.agent_phone}
                    onChange={(e) => handleInputChange("agent_phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agent_email">Agent Email</Label>
                  <Input
                    id="agent_email"
                    type="email"
                    value={formData.agent_email}
                    onChange={(e) => handleInputChange("agent_email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange("meta_title", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange("meta_description", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Floor Plans - Only for Sale Properties */}
          {formData.purpose === 'sale' && (
          <Card>
            <CardHeader>
              <CardTitle>Floor Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="floor_plan_title">Plan Title</Label>
                  <Input
                    id="floor_plan_title"
                    value={newFloorPlan.title}
                    onChange={(e) => setNewFloorPlan({ ...newFloorPlan, title: e.target.value })}
                    placeholder="e.g., 1 Bedroom Apartment, 2 Bedroom + Study"
                  />
                </div>
                <div>
                  <Label htmlFor="floor_plan_size">Size</Label>
                  <Input
                    id="floor_plan_size"
                    value={newFloorPlan.size}
                    onChange={(e) => setNewFloorPlan({ ...newFloorPlan, size: e.target.value })}
                    placeholder="e.g., 778 to 1,156 sq. ft."
                  />
                </div>
                <div>
                  <Label htmlFor="floor_plan_image">Floor Plan Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="floor_plan_image"
                      value={newFloorPlan.image}
                      onChange={(e) => setNewFloorPlan({ ...newFloorPlan, image: e.target.value })}
                      placeholder="https://... or upload from device"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFloorPlanImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingFloorPlan}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        disabled={uploadingFloorPlan}
                      >
                        {uploadingFloorPlan ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {newFloorPlan.image && (
                    <div className="mt-2">
                      <img 
                        src={newFloorPlan.image} 
                        alt="Floor plan preview" 
                        className="h-20 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
                <Button type="button" onClick={addFloorPlan} className="w-full">
                  Add Floor Plan
                </Button>
              </div>
              
              {formData.floor_plans.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Floor Plans ({formData.floor_plans.length})</Label>
                  {formData.floor_plans.map((plan, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {plan.image && (
                        <img 
                          src={plan.image} 
                          alt={plan.title}
                          className="h-16 w-16 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-primary">{plan.title}</p>
                        <p className="text-sm text-muted-foreground">{plan.size}</p>
                        {plan.image && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {plan.image}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFloorPlan(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Payment Plan & Handover - Only for Sale Properties */}
          {formData.purpose === 'sale' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Plan & Handover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Plan Table</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Build a structured payment plan table with optional headers (e.g., "Studio Plan", "1BR Plan") and payment details
                </p>
                
                <div className="grid grid-cols-1 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="plan_header">Plan Header (Optional)</Label>
                    <Input
                      id="plan_header"
                      value={newPaymentRow.header}
                      onChange={(e) => setNewPaymentRow({ ...newPaymentRow, header: e.target.value })}
                      placeholder="e.g., Studio Plan, 1BR Plan, 2BR Plan"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for regular payment rows. Add a header like "Studio Plan" to group payment terms
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="milestone">Milestone</Label>
                      <Input
                        id="milestone"
                        value={newPaymentRow.milestone}
                        onChange={(e) => setNewPaymentRow({ ...newPaymentRow, milestone: e.target.value })}
                        placeholder="e.g., Booking, During construction"
                      />
                    </div>
                    <div>
                      <Label htmlFor="percentage">Percentage</Label>
                      <Input
                        id="percentage"
                        value={newPaymentRow.percentage}
                        onChange={(e) => setNewPaymentRow({ ...newPaymentRow, percentage: e.target.value })}
                        placeholder="e.g., 20%, 40%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="note">Note</Label>
                      <Input
                        id="note"
                        value={newPaymentRow.note}
                        onChange={(e) => setNewPaymentRow({ ...newPaymentRow, note: e.target.value })}
                        placeholder="e.g., On reservation"
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={addPaymentRow}
                  variant="outline"
                  className="w-full mb-4"
                >
                  Add Payment Row
                </Button>

                {formData.payment_plan_table.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Milestone</th>
                          <th className="px-4 py-2 text-left font-semibold">Percentage</th>
                          <th className="px-4 py-2 text-left font-semibold">Note</th>
                          <th className="px-4 py-2 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.payment_plan_table.map((row, index) => (
                          row.header ? (
                            <tr key={index} className="border-t bg-blue-50">
                              <td colSpan={4} className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-bold text-gray-900">{row.header}</span>
                                  <button
                                    type="button"
                                    onClick={() => removePaymentRow(index)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete header"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2 font-semibold text-gray-700">{row.milestone}</td>
                              <td className="px-4 py-2 font-medium text-primary">{row.percentage}</td>
                              <td className="px-4 py-2">{row.note}</td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removePaymentRow(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="payment_plan">Payment Plan (Rich Text - Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add formatted payment plan details with tables, lists, and styling
                </p>
                <AdvancedRichTextEditor
                  content={formData.payment_plan}
                  onChange={(html) => handleInputChange("payment_plan", html)}
                  placeholder="Additional payment plan details with formatting..."
                  minHeight="250px"
                  propertyId={id}
                />
              </div>
              
              <div>
                <Label htmlFor="handover_date">Handover Date</Label>
                <Input
                  id="handover_date"
                  value={formData.handover_date}
                  onChange={(e) => handleInputChange("handover_date", e.target.value)}
                  placeholder="e.g., Q4 2025, December 2025"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected handover date for the property
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="agent_name">Agent Name</Label>
                  <Input
                    id="agent_name"
                    value={formData.agent_name}
                    onChange={(e) => handleInputChange("agent_name", e.target.value)}
                    placeholder="Agent name"
                  />
                </div>
                <div>
                  <Label htmlFor="agent_phone">Agent Phone</Label>
                  <Input
                    id="agent_phone"
                    value={formData.agent_phone}
                    onChange={(e) => handleInputChange("agent_phone", e.target.value)}
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="agent_email">Agent Email</Label>
                  <Input
                    id="agent_email"
                    type="email"
                    value={formData.agent_email}
                    onChange={(e) => handleInputChange("agent_email", e.target.value)}
                    placeholder="agent@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status - Only for Sale Properties */}
          {formData.purpose === 'sale' && (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Property</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange("featured", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => handleInputChange("published", checked)}
                />
              </div>
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Homepage featured sections</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured_dubai">Featured in Dubai</Label>
                  <Switch
                    id="featured_dubai"
                    checked={formData.featured_dubai}
                    onCheckedChange={(checked) => handleInputChange("featured_dubai", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured_abu_dhabi">Featured in Abu Dhabi</Label>
                  <Switch
                    id="featured_abu_dhabi"
                    checked={formData.featured_abu_dhabi}
                    onCheckedChange={(checked) => handleInputChange("featured_abu_dhabi", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured_ras_al_khaimah">Featured near Wynn Casino</Label>
                  <Switch
                    id="featured_ras_al_khaimah"
                    checked={formData.featured_ras_al_khaimah}
                    onCheckedChange={(checked) => handleInputChange("featured_ras_al_khaimah", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured_umm_al_quwain">Featured in Umm Al Quwain</Label>
                  <Switch
                    id="featured_umm_al_quwain"
                    checked={formData.featured_umm_al_quwain}
                    onCheckedChange={(checked) => handleInputChange("featured_umm_al_quwain", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Rental Status - Simplified for Rent Properties */}
          {formData.purpose === 'rent' && (
          <Card>
            <CardHeader>
              <CardTitle>Rental Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Rental</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange("featured", checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Featured rentals appear in the "Jumeirah Rentals" section
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => handleInputChange("published", checked)}
                />
              </div>
            </CardContent>
          </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/properties")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {id ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{id ? "Update" : "Create"} Property</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PropertyForm;
