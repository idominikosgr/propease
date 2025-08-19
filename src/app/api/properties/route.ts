/**
 * Properties API Route
 * Public API for searching and retrieving properties
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { PropertySearchFilters } from "@/lib/supabase-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check data source preference (materialized view vs direct table)
    const useDirectTable = searchParams.get("source") === "direct";

    // Parse search filters from query parameters
    const filters: PropertySearchFilters = {
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      minRooms: searchParams.get("minRooms")
        ? Number(searchParams.get("minRooms"))
        : undefined,
      maxRooms: searchParams.get("maxRooms")
        ? Number(searchParams.get("maxRooms"))
        : undefined,
      minSqrMeters: searchParams.get("minSqrMeters")
        ? Number(searchParams.get("minSqrMeters"))
        : undefined,
      maxSqrMeters: searchParams.get("maxSqrMeters")
        ? Number(searchParams.get("maxSqrMeters"))
        : undefined,
      search: searchParams.get("search") || undefined,
      lat: searchParams.get("lat")
        ? Number(searchParams.get("lat"))
        : undefined,
      lng: searchParams.get("lng")
        ? Number(searchParams.get("lng"))
        : undefined,
      radius: searchParams.get("radius")
        ? Number(searchParams.get("radius"))
        : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      offset: searchParams.get("offset")
        ? Number(searchParams.get("offset"))
        : 0,
    };

    // Parse array parameters
    if (searchParams.get("areaIds")) {
      filters.areaIds = searchParams.get("areaIds")!.split(",").map(Number);
    }
    if (searchParams.get("subareaIds")) {
      filters.subareaIds = searchParams
        .get("subareaIds")!
        .split(",")
        .map(Number);
    }
    if (searchParams.get("categoryIds")) {
      filters.categoryIds = searchParams
        .get("categoryIds")!
        .split(",")
        .map(Number);
    }
    if (searchParams.get("subcategoryIds")) {
      filters.subcategoryIds = searchParams
        .get("subcategoryIds")!
        .split(",")
        .map(Number);
    }
    if (searchParams.get("energyClassIds")) {
      filters.energyClassIds = searchParams
        .get("energyClassIds")!
        .split(",")
        .map(Number);
    }

    // Initialize Supabase client for server-side operations
    const supabase = await createSupabaseServiceClient();

    // Query the properties table with actual fields from schema
    let query = supabase
      .from("properties")
      .select(`
        id,
        ilist_id,
        price,
        rooms,
        sqr_meters,
        area_id,
        subarea_id,
        category_id,
        subcategory_id,
        status_id,
        bathrooms,
        building_year,
        energy_class_id,
        latitude,
        longitude,
        custom_code,
        update_date,
        created_at,
        price_per_sqrm,
        master_bedrooms,
        wc,
        plot_sqr_meters,
        postal_code,
        floor_id,
        levels,
        total_parkings,
        send_date,
        token
      `)
      .eq("status_id", 1); // Only active properties

    // Apply filters
    if (filters.minPrice) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
    if (filters.minRooms) query = query.gte("rooms", filters.minRooms);
    if (filters.maxRooms) query = query.lte("rooms", filters.maxRooms);
    if (filters.minSqrMeters)
      query = query.gte("sqr_meters", filters.minSqrMeters);
    if (filters.maxSqrMeters)
      query = query.lte("sqr_meters", filters.maxSqrMeters);
    if (filters.areaIds?.length) query = query.in("area_id", filters.areaIds);
    if (filters.subareaIds?.length)
      query = query.in("subarea_id", filters.subareaIds);
    if (filters.energyClassIds?.length)
      query = query.in("energy_class_id", filters.energyClassIds);

    // Text search - search in custom_code and postal_code for now
    // TODO: Implement full-text search with property_characteristics table join
    if (filters.search) {
      query = query.or(`custom_code.ilike.%${filters.search}%,postal_code.ilike.%${filters.search}%`);
    }

    // Pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset)
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );

    // Order by most recent
    query = query.order("update_date", { ascending: false });

    const { data: properties, error } = await query;

    if (error) {
      console.error("Database query error:", error);
      throw new Error(error.message);
    }

    // Transform the data to include name fields expected by frontend
    // For now, use placeholder names - these would normally come from lookup tables
    const transformedProperties = properties?.map((property: any) => ({
      ...property,
      title: property.custom_code || `Property ${property.ilist_id}`, // Use custom_code as title fallback
      description: null, // Will need to fetch from property_characteristics table
      area_name: `Area ${property.area_id}`,
      subarea_name: `Subarea ${property.subarea_id}`, 
      category_name: property.category_id === 1 ? "Residential" : 
                    property.category_id === 2 ? "Commercial" : 
                    property.category_id === 3 ? "Land" : "Other",
      subcategory_name: property.subcategory_id === 1 ? "Apartment" :
                       property.subcategory_id === 2 ? "House" :
                       property.subcategory_id === 3 ? "Villa" : "Property",
      energy_class_name: property.energy_class_id ? `Class ${property.energy_class_id}` : null,
      status_name: property.status_id === 1 ? "For Sale" : "Unavailable",
      primary_image: null, // Will need to fetch from property_images table
      construction_year: property.building_year, // Map building_year to construction_year for frontend compatibility
      floor: property.floor_id, // Map floor_id to floor for frontend compatibility
      created_date: property.created_at, // Map created_at to created_date for frontend compatibility
      golden_visa_eligible: false // Default value for now
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedProperties,
      total: transformedProperties.length,
      filters,
    });
  } catch (error) {
    console.error("Properties search error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search properties",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
