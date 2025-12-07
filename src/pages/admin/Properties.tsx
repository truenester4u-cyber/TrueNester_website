import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { parsePropertyTypes } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  property_type: string;
  purpose: string;
  city: string;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  featured: boolean;
  price_display: string | null;
  featured_dubai: boolean;
  featured_abu_dhabi: boolean;
  featured_ras_al_khaimah: boolean;
  published: boolean;
  views: number;
  created_at: string;
  featured_image: string | null;
}

const PAGE_SIZE = 10;

const Properties = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      const filtered = properties.filter((property) => {
        const propertyTypes = parsePropertyTypes(property.property_type).map((type) => type.toLowerCase());
        return (
          property.title.toLowerCase().includes(searchTerm) ||
          property.city.toLowerCase().includes(searchTerm) ||
          property.location.toLowerCase().includes(searchTerm) ||
          propertyTypes.some((type) => type.includes(searchTerm))
        );
      });
      setFilteredProperties(filtered);
      setCurrentPage(1);
    } else {
      setFilteredProperties(properties);
      setCurrentPage(1);
    }
  }, [searchQuery, properties]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProperties.length, currentPage]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      setFilteredProperties(data || []);
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property deleted successfully",
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.length} properties deleted successfully`,
      });

      setSelectedIds([]);
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkDeleteDialog(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayPrice = (property: Property) => {
    const label = property.price_display?.trim();
    if (label) return label;
    if (property.price === null || property.price === undefined) return "—";
    return formatPrice(property.price);
  };

  const filterByCity = (city: string) => {
    const filtered = properties.filter((property) => property.city === city);
    setFilteredProperties(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pageSelectionIds = paginatedProperties.map((property) => property.id);
  const allPageSelected = pageSelectionIds.length > 0 && pageSelectionIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageSelectionIds.includes(id)));
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...pageSelectionIds.filter((id) => !prev.includes(id))
      ]);
    }
  };

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const showingStart = filteredProperties.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredProperties.length);

  return (
    <AdminLayout>
      <div className="h-full flex flex-col p-6">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold">Properties</h1>
            <p className="text-gray-600">Manage all properties</p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setBulkDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedIds.length})
                </Button>
              </>
            )}
            <Button onClick={() => navigate("/admin/properties/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        <div className="mb-4 flex-shrink-0">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => filterByCity("Dubai")}>
              Dubai
            </Button>
            <Button variant="outline" onClick={() => filterByCity("Abu Dhabi")}>
              Abu Dhabi
            </Button>
            <Button variant="outline" onClick={() => filterByCity("RAS AL KHAIMA")}>
              RAS AL KHAIMA
            </Button>
          </div>
        </div>

        <div className="mb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties by title, city, location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-8 text-center">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? "No properties found matching your search" : "No properties yet"}
            </div>
          ) : (
            <>
            <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={pageSelectionIds.length > 0 && allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProperties.map((property) => {
                  const propertyTypes = parsePropertyTypes(property.property_type);
                  return (
                    <TableRow key={property.id} className={selectedIds.includes(property.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(property.id)}
                        onChange={() => toggleSelect(property.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      {property.featured_image ? (
                        <img
                          src={property.featured_image}
                          alt={property.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{property.title}</div>
                        <div className="text-sm text-gray-500 truncate">{property.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {propertyTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {propertyTypes.map((type) => (
                            <Badge key={`${property.id}-${type}`} variant="outline" className="capitalize">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={property.purpose === "sale" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {property.purpose}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{property.city}</div>
                        <div className="text-sm text-gray-500 truncate">{property.location}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {getDisplayPrice(property)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {property.bedrooms && property.bathrooms ? (
                          <>
                            {property.bedrooms} BR • {property.bathrooms} BA
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {property.featured && (
                          <Badge variant="default" className="w-fit">
                            Featured
                          </Badge>
                        )}
                        {property.featured_dubai && (
                          <Badge variant="outline" className="w-fit border-primary text-primary">
                            Dubai Spotlight
                          </Badge>
                        )}
                        {property.featured_abu_dhabi && (
                          <Badge variant="outline" className="w-fit border-emerald-600 text-emerald-600">
                            Abu Dhabi Spotlight
                          </Badge>
                        )}
                        {property.featured_ras_al_khaimah && (
                          <Badge variant="outline" className="w-fit border-orange-500 text-orange-500">
                            Wynn Casino Spotlight
                          </Badge>
                        )}
                        {property.published ? (
                          <Badge variant="default" className="w-fit bg-green-500">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        {property.views}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/properties/edit/${property.id}`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(property.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {showingStart}-{showingEnd} of {filteredProperties.length} properties
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  Previous
                </Button>
                <span className="text-sm font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="outline" onClick={goToNextPage} disabled={currentPage === totalPages || filteredProperties.length === 0}>
                  Next
                </Button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Properties?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedIds.length} properties. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Properties;
