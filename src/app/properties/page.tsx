"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SearchIcon, 
  FilterIcon, 
  MapPinIcon, 
  HomeIcon, 
  RulerIcon,
  MapIcon,
  GridIcon,
  SlidersHorizontalIcon,
  StarIcon,
  EuroIcon,
  CalendarIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  ScaleIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import SaveSearchDialog from "@/components/save-search-dialog";
import PropertyComparison from "@/components/property-comparison";
import LeadGenerationForm from "@/components/lead-generation-form";

// Dynamically import map component to avoid SSR issues
const PropertyMap = dynamic(() => import("@/components/property-map"), { 
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />
});

interface Property {
  id: number;
  title: string;
  price: number;
  rooms: number;
  sqr_meters: number;
  area_name: string;
  subarea_name: string;
  category_name: string;
  subcategory_name: string;
  primary_image?: string;
  description: string;
  status_name: string;
  bathrooms?: number;
  floor?: number;
  construction_year?: number;
  energy_class_name?: string;
  latitude?: number;
  longitude?: number;
  golden_visa_eligible?: boolean;
}

interface PropertyResponse {
  success: boolean;
  data: Property[];
  total: number;
}

interface SearchFilters {
  searchTerm: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  priceRange: number[];
  minRooms: string;
  maxRooms: string;
  minSqrMeters: string;
  maxSqrMeters: string;
  areaId: string;
  subareaId: string;
  energyClass: string;
  goldenVisaOnly: boolean;
  constructionYear: string;
  floor: string;
  sortBy: string;
}

const PROPERTY_CATEGORIES = [
  { value: "all", label: "All Properties" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" }
];

const ATHENS_AREAS = [
  { value: "all", label: "All Areas" },
  { value: "center", label: "Athens Center" },
  { value: "north", label: "Northern Suburbs" },
  { value: "south", label: "Southern Suburbs" },
  { value: "east", label: "Eastern Suburbs" },
  { value: "west", label: "Western Suburbs" },
  { value: "piraeus", label: "Piraeus" }
];

const ENERGY_CLASSES = [
  { value: "all", label: "All Classes" },
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "B+", label: "B+" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" }
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "size_desc", label: "Largest First" },
  { value: "rooms_desc", label: "Most Rooms First" }
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    priceRange: [0, 2000000],
    minRooms: "",
    maxRooms: "",
    minSqrMeters: "",
    maxSqrMeters: "",
    areaId: "all",
    subareaId: "all",
    energyClass: "all",
    goldenVisaOnly: false,
    constructionYear: "",
    floor: "",
    sortBy: "newest"
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: false
  });

  const fetchProperties = async (reset = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: reset ? "0" : ((pagination.page - 1) * pagination.limit).toString(),
      });

      // Add search filters
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minRooms) params.append("minRooms", filters.minRooms);
      if (filters.maxRooms) params.append("maxRooms", filters.maxRooms);
      if (filters.minSqrMeters) params.append("minSqrMeters", filters.minSqrMeters);
      if (filters.maxSqrMeters) params.append("maxSqrMeters", filters.maxSqrMeters);
      
      // Add categorical filters
      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.areaId !== "all") params.append("areaId", filters.areaId);
      if (filters.energyClass !== "all") params.append("energyClass", filters.energyClass);
      
      // Add Golden Visa filter
      if (filters.goldenVisaOnly) params.append("goldenVisa", "true");

      const response = await fetch(`/api/properties?${params.toString()}`);
      const result: PropertyResponse = await response.json();

      if (result.success) {
        if (reset) {
          setProperties(result.data);
          setPagination(prev => ({ ...prev, page: 1, total: result.total }));
        } else {
          setProperties(prev => [...prev, ...result.data]);
        }
        setPagination(prev => ({ 
          ...prev, 
          total: result.total,
          hasMore: result.data.length === pagination.limit 
        }));
      } else {
        console.error("Failed to fetch properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProperties(true);
  };

  const loadMore = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    fetchProperties(false);
  };

  useEffect(() => {
    fetchProperties(true);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPriceShort = (price: number) => {
    if (price >= 1000000) {
      return `€${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `€${(price / 1000).toFixed(0)}K`;
    }
    return `€${price}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Properties in Greece
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover your perfect property in Athens and surrounding areas
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {pagination.total} Properties Available
            </Badge>
            {filters.goldenVisaOnly && (
              <Badge variant="default" className="bg-yellow-600">
                <StarIcon className="w-3 h-3 mr-1" />
                Golden Visa Eligible
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar & View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by location, property type..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
            >
              <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <SaveSearchDialog filters={filters} resultsCount={pagination.total}>
              <Button variant="outline" size="sm">
                <StarIcon className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </SaveSearchDialog>
            
            <PropertyComparison>
              <Button variant="outline" size="sm">
                <ScaleIcon className="w-4 h-4 mr-2" />
                Compare
              </Button>
            </PropertyComparison>
            
            <LeadGenerationForm source="property_page">
              <Button size="sm">
                Get Expert Advice
              </Button>
            </LeadGenerationForm>
            
            <div className="flex items-center rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <GridIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="h-8 px-3"
              >
                <MapIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Search Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="golden-visa"
                    checked={filters.goldenVisaOnly}
                    onCheckedChange={(checked) => handleFilterChange("goldenVisaOnly", checked)}
                  />
                  <Label htmlFor="golden-visa" className="flex items-center">
                    <StarIcon className="w-4 h-4 mr-1 text-yellow-600" />
                    Golden Visa Eligible
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Property Type */}
                <div>
                  <Label>Property Type</Label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => handleFilterChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <Label>Area</Label>
                  <Select 
                    value={filters.areaId} 
                    onValueChange={(value) => handleFilterChange("areaId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATHENS_AREAS.map(area => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Energy Class */}
                <div>
                  <Label>Energy Class</Label>
                  <Select 
                    value={filters.energyClass} 
                    onValueChange={(value) => handleFilterChange("energyClass", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENERGY_CLASSES.map(energy => (
                        <SelectItem key={energy.value} value={energy.value}>
                          {energy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <Label>Sort By</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => handleFilterChange("sortBy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label className="mb-2 block">
                  Price Range: {formatPriceShort(filters.priceRange[0])} - {formatPriceShort(filters.priceRange[1])}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange("priceRange", value)}
                  max={2000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>€0</span>
                  <span>€2M+</span>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Min Rooms</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.minRooms}
                    onChange={(e) => handleFilterChange("minRooms", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Rooms</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.maxRooms}
                    onChange={(e) => handleFilterChange("maxRooms", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Min Size (m²)</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.minSqrMeters}
                    onChange={(e) => handleFilterChange("minSqrMeters", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Size (m²)</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.maxSqrMeters}
                    onChange={(e) => handleFilterChange("maxSqrMeters", e.target.value)}
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      searchTerm: "",
                      category: "all",
                      minPrice: "",
                      maxPrice: "",
                      priceRange: [0, 2000000],
                      minRooms: "",
                      maxRooms: "",
                      minSqrMeters: "",
                      maxSqrMeters: "",
                      areaId: "all",
                      subareaId: "all",
                      energyClass: "all",
                      goldenVisaOnly: false,
                      constructionYear: "",
                      floor: "",
                      sortBy: "newest"
                    });
                    fetchProperties(true);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "map")}>
          <TabsContent value="grid">
            {/* Properties Grid */}
            {loading && properties.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <HomeIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse all available properties.
                </p>
                <Button onClick={() => {
                  setFilters({
                    searchTerm: "",
                    category: "all",
                    minPrice: "",
                    maxPrice: "",
                    priceRange: [0, 2000000],
                    minRooms: "",
                    maxRooms: "",
                    minSqrMeters: "",
                    maxSqrMeters: "",
                    areaId: "all",
                    subareaId: "all",
                    energyClass: "all",
                    goldenVisaOnly: false,
                    constructionYear: "",
                    floor: "",
                    sortBy: "newest"
                  });
                  fetchProperties(true);
                }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Load More */}
                {pagination.hasMore && (
                  <div className="text-center mt-8">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Load More Properties"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="map">
            <div className="h-[70vh]">
              <Suspense fallback={<div className="h-full bg-muted animate-pulse rounded-lg" />}>
                <PropertyMap properties={properties} />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const addToComparison = () => {
    const comparedProperties = JSON.parse(localStorage.getItem("comparedProperties") || "[]");
    
    if (comparedProperties.length >= 4) {
      alert("You can compare up to 4 properties at once");
      return;
    }
    
    if (comparedProperties.some((p: Property) => p.id === property.id)) {
      alert("Property already in comparison");
      return;
    }
    
    comparedProperties.push(property);
    localStorage.setItem("comparedProperties", JSON.stringify(comparedProperties));
    alert("Property added to comparison");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative h-48 bg-muted">
        {property.primary_image ? (
          <Image
            src={property.primary_image}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <HomeIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {property.category_name}
          </Badge>
          {property.golden_visa_eligible && (
            <Badge variant="default" className="bg-yellow-600/90 backdrop-blur-sm">
              <StarIcon className="w-3 h-3 mr-1" />
              Golden Visa
            </Badge>
          )}
        </div>

        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {property.subcategory_name}
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {property.title}
        </CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {property.subarea_name}, {property.area_name}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(property.price)}
          </div>
          {property.energy_class_name && (
            <Badge variant="outline" className="text-xs">
              Energy: {property.energy_class_name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <BedIcon className="w-4 h-4 mr-1" />
            {property.rooms}
          </div>
          {property.bathrooms && (
            <div className="flex items-center">
              <BathIcon className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </div>
          )}
          <div className="flex items-center">
            <RulerIcon className="w-4 h-4 mr-1" />
            {property.sqr_meters} m²
          </div>
        </div>

        {property.construction_year && (
          <div className="flex items-center text-xs text-muted-foreground mb-3">
            <CalendarIcon className="w-3 h-3 mr-1" />
            Built in {property.construction_year}
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {property.description}
        </p>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Link href={`/properties/${property.id}`} className="flex-1">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                View Details
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={addToComparison}
              className="px-3"
              title="Add to comparison"
            >
              <ScaleIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <LeadGenerationForm
            propertyId={property.id}
            propertyTitle={property.title}
            propertyPrice={property.price}
            propertyArea={`${property.subarea_name}, ${property.area_name}`}
            source="property_page"
          >
            <Button variant="outline" className="w-full" size="sm">
              Contact Agent
            </Button>
          </LeadGenerationForm>
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/3 mb-3" />
        <div className="flex gap-4 mb-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}