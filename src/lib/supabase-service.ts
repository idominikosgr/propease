/**
 * Supabase Service for Property Management
 * Handles all database operations with 100% iList parity
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  IListProperty,
  IListImage,
  IListCharacteristic,
  IListPartner,
} from "./ilist-api";

// Database types matching our schema
export interface Property {
  id: string;
  ilist_id: number;
  category_id?: number;
  subcategory_id?: number;
  aim_id?: number;
  custom_code?: string;
  price?: number;
  sqr_meters?: number;
  price_per_sqrm?: number;
  building_year?: number;
  plot_sqr_meters?: number;
  rooms?: number;
  master_bedrooms?: number;
  bathrooms?: number;
  wc?: number;
  area_id?: number;
  subarea_id?: number;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  energy_class_id?: number;
  floor_id?: number;
  levels?: string;
  total_parkings?: number;
  send_date?: string;
  update_date?: string;
  token?: string;
  is_sync?: boolean;
  status_id?: number;
  ilist_raw_data: any;
  last_ilist_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyWithDetails extends Property {
  images?: PropertyImage[];
  characteristics?: PropertyCharacteristic[];
  partner?: PropertyPartner;
  title?: string;
  description?: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  ilist_image_id?: number;
  order_num?: number;
  url: string;
  thumb_url?: string;
  created_at?: string;
}

export interface PropertyCharacteristic {
  id: string;
  property_id: string;
  ilist_characteristic_id?: number;
  language_id?: number;
  title: string;
  value?: string;
  lookup_type?: string;
  created_at?: string;
}

export interface PropertyPartner {
  id: string;
  property_id: string;
  ilist_partner_id?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  created_at?: string;
}

export interface IListSyncSession {
  id: string;
  sync_type: string;
  status: "pending" | "syncing" | "completed" | "failed";
  status_id?: number;
  include_deleted_from_crm?: boolean;
  send_date_from_utc?: string;
  send_date_to_utc?: string;
  update_date_from_utc?: string;
  update_date_to_utc?: string;
  total_properties?: number;
  new_properties?: number;
  updated_properties?: number;
  deleted_properties?: number;
  failed_properties?: number;
  error_message?: string;
  error_details?: any;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  api_responses?: any;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  status?: string;
  assigned_to?: string;
  sent_to_ilist?: boolean;
  ilist_lead_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PropertySearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minSqrMeters?: number;
  maxSqrMeters?: number;
  areaIds?: number[];
  subareaIds?: number[];
  categoryIds?: number[];
  subcategoryIds?: number[];
  energyClassIds?: number[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number; // in km
  limit?: number;
  offset?: number;
}

/**
 * Supabase Service Class
 */
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upsert property from iList data
   */
  async upsertPropertyFromIList(ilistProperty: IListProperty): Promise<string> {
    const { data, error } = await this.supabase.rpc(
      "upsert_property_from_ilist",
      {
        ilist_data: ilistProperty,
      },
    );

    if (error) {
      throw new Error(`Failed to upsert property: ${error.message}`);
    }

    const propertyId = data as string;

    // Handle related data
    await Promise.all([
      this.upsertPropertyImages(propertyId, ilistProperty.Images || []),
      this.upsertPropertyCharacteristics(
        propertyId,
        ilistProperty.Characteristics || [],
      ),
      this.upsertPropertyPartner(propertyId, ilistProperty.Partner),
      this.upsertPropertyDistances(
        propertyId,
        ilistProperty.DistanceFrom || [],
      ),
      this.upsertPropertyParkings(propertyId, ilistProperty.Parkings || []),
      this.upsertPropertyBasements(propertyId, ilistProperty.Basements || []),
      this.upsertPropertyFlags(propertyId, ilistProperty.Flags || []),
    ]);

    return propertyId;
  }

  /**
   * Upsert property images
   */
  private async upsertPropertyImages(
    propertyId: string,
    images: IListImage[],
  ): Promise<void> {
    if (!images.length) return;

    // Delete existing images
    await this.supabase
      .from("property_images")
      .delete()
      .eq("property_id", propertyId);

    // Insert new images
    const imagesToInsert = images.map((img) => ({
      property_id: propertyId,
      ilist_image_id: img.Id,
      order_num: img.OrderNum,
      url: img.Url,
      thumb_url: img.ThumbUrl,
    }));

    const { error } = await this.supabase
      .from("property_images")
      .insert(imagesToInsert);

    if (error) {
      console.error("Error upserting property images:", error);
    }
  }

  /**
   * Upsert property characteristics
   */
  private async upsertPropertyCharacteristics(
    propertyId: string,
    characteristics: IListCharacteristic[],
  ): Promise<void> {
    if (!characteristics.length) return;

    // Delete existing characteristics
    await this.supabase
      .from("property_characteristics")
      .delete()
      .eq("property_id", propertyId);

    // Insert new characteristics
    const characteristicsToInsert = characteristics.map((char) => ({
      property_id: propertyId,
      ilist_characteristic_id: char.Id,
      language_id: char.Language_Id,
      title: char.Title,
      value: char.Value,
      lookup_type: char.LookupType,
    }));

    const { error } = await this.supabase
      .from("property_characteristics")
      .insert(characteristicsToInsert);

    if (error) {
      console.error("Error upserting property characteristics:", error);
    }
  }

  /**
   * Upsert property partner
   */
  private async upsertPropertyPartner(
    propertyId: string,
    partner?: IListPartner,
  ): Promise<void> {
    // Delete existing partner
    await this.supabase
      .from("property_partners")
      .delete()
      .eq("property_id", propertyId);

    if (!partner) return;

    // Insert new partner
    const { error } = await this.supabase.from("property_partners").insert({
      property_id: propertyId,
      ilist_partner_id: partner.Id,
      firstname: partner.Firstname,
      lastname: partner.Lastname,
      email: partner.Email,
      phone: partner.Phone,
      photo_url: partner.PhotoUrl,
    });

    if (error) {
      console.error("Error upserting property partner:", error);
    }
  }

  /**
   * Upsert property distances
   */
  private async upsertPropertyDistances(
    propertyId: string,
    distances: any[],
  ): Promise<void> {
    // Delete existing distances
    await this.supabase
      .from("property_distances")
      .delete()
      .eq("property_id", propertyId);

    if (!distances.length) return;

    // Insert new distances
    const distancesToInsert = distances.map((dist) => ({
      property_id: propertyId,
      place_id: dist.Place_ID,
      distance: dist.Distance,
      measure_id: dist.Measure_ID,
      descriptions: dist.Description,
    }));

    const { error } = await this.supabase
      .from("property_distances")
      .insert(distancesToInsert);

    if (error) {
      console.error("Error upserting property distances:", error);
    }
  }

  /**
   * Upsert property parkings
   */
  private async upsertPropertyParkings(
    propertyId: string,
    parkings: any[],
  ): Promise<void> {
    // Delete existing parkings
    await this.supabase
      .from("property_parkings")
      .delete()
      .eq("property_id", propertyId);

    if (!parkings.length) return;

    // Insert new parkings
    const parkingsToInsert = parkings.map((parking) => ({
      property_id: propertyId,
      parking_data: parking,
    }));

    const { error } = await this.supabase
      .from("property_parkings")
      .insert(parkingsToInsert);

    if (error) {
      console.error("Error upserting property parkings:", error);
    }
  }

  /**
   * Upsert property basements
   */
  private async upsertPropertyBasements(
    propertyId: string,
    basements: any[],
  ): Promise<void> {
    // Delete existing basements
    await this.supabase
      .from("property_basements")
      .delete()
      .eq("property_id", propertyId);

    if (!basements.length) return;

    // Insert new basements
    const basementsToInsert = basements.map((basement) => ({
      property_id: propertyId,
      basement_data: basement,
    }));

    const { error } = await this.supabase
      .from("property_basements")
      .insert(basementsToInsert);

    if (error) {
      console.error("Error upserting property basements:", error);
    }
  }

  /**
   * Upsert property flags
   */
  private async upsertPropertyFlags(
    propertyId: string,
    flags: any[],
  ): Promise<void> {
    // Delete existing flags
    await this.supabase
      .from("property_flags")
      .delete()
      .eq("property_id", propertyId);

    if (!flags.length) return;

    // Insert new flags
    const flagsToInsert = flags.map((flag) => ({
      property_id: propertyId,
      flag_data: flag,
    }));

    const { error } = await this.supabase
      .from("property_flags")
      .insert(flagsToInsert);

    if (error) {
      console.error("Error upserting property flags:", error);
    }
  }

  /**
   * Search properties with filters
   */
  async searchProperties(
    filters: PropertySearchFilters = {},
  ): Promise<PropertyWithDetails[]> {
    let query = this.supabase.from("property_search_optimized").select("*");

    // Apply filters
    if (filters.minPrice) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte("price", filters.maxPrice);
    }
    if (filters.minRooms) {
      query = query.gte("rooms", filters.minRooms);
    }
    if (filters.maxRooms) {
      query = query.lte("rooms", filters.maxRooms);
    }
    if (filters.minSqrMeters) {
      query = query.gte("sqr_meters", filters.minSqrMeters);
    }
    if (filters.maxSqrMeters) {
      query = query.lte("sqr_meters", filters.maxSqrMeters);
    }
    if (filters.areaIds?.length) {
      query = query.in("area_id", filters.areaIds);
    }
    if (filters.subareaIds?.length) {
      query = query.in("subarea_id", filters.subareaIds);
    }
    if (filters.energyClassIds?.length) {
      query = query.in("energy_class_id", filters.energyClassIds);
    }

    // Text search
    if (filters.search) {
      query = query.textSearch("title", filters.search, {
        type: "websearch",
      });
    }

    // Location-based search
    if (filters.lat && filters.lng && filters.radius) {
      // For now, we'll use simple bounding box filtering
      // TODO: Implement proper PostGIS distance calculations with custom RPC
      const latRange = filters.radius / 111; // Rough conversion km to degrees
      const lngRange =
        filters.radius / (111 * Math.cos((filters.lat * Math.PI) / 180));

      query = query
        .gte("latitude", filters.lat - latRange)
        .lte("latitude", filters.lat + latRange)
        .gte("longitude", filters.lng - lngRange)
        .lte("longitude", filters.lng + lngRange);
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    // Order by most recent
    query = query.order("update_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search properties: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get property by ID with full details
   */
  async getPropertyById(id: string): Promise<PropertyWithDetails | null> {
    const { data, error } = await this.supabase
      .from("properties")
      .select(
        `
        *,
        images:property_images(*),
        characteristics:property_characteristics(*),
        partner:property_partners(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get property: ${error.message}`);
    }

    return data;
  }

  /**
   * Get property by iList ID
   */
  async getPropertyByIListId(
    ilistId: number,
  ): Promise<PropertyWithDetails | null> {
    const { data, error } = await this.supabase
      .from("properties")
      .select(
        `
        *,
        images:property_images(*),
        characteristics:property_characteristics(*),
        partner:property_partners(*)
      `,
      )
      .eq("ilist_id", ilistId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get property: ${error.message}`);
    }

    return data;
  }

  /**
   * Create sync session
   */
  async createSyncSession(
    syncData: Partial<IListSyncSession>,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("ilist_sync_sessions")
      .insert(syncData)
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create sync session: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Update sync session
   */
  async updateSyncSession(
    id: string,
    updates: Partial<IListSyncSession>,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("ilist_sync_sessions")
      .update(updates)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update sync session: ${error.message}`);
    }
  }

  /**
   * Get latest sync session
   */
  async getLatestSyncSession(): Promise<IListSyncSession | null> {
    const { data, error } = await this.supabase
      .from("ilist_sync_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get latest sync session: ${error.message}`);
    }

    return data;
  }

  /**
   * Create property inquiry
   */
  async createPropertyInquiry(
    inquiry: Omit<PropertyInquiry, "id" | "created_at" | "updated_at">,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("property_inquiries")
      .insert(inquiry)
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create property inquiry: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get property inquiries
   */
  async getPropertyInquiries(
    propertyId?: string,
    status?: string,
  ): Promise<PropertyInquiry[]> {
    let query = this.supabase.from("property_inquiries").select("*");

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get property inquiries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update iList configuration
   */
  async updateIListConfig(config: {
    auth_token: string;
    api_base_url?: string;
    is_active?: boolean;
    rate_limit_per_minute?: number;
  }): Promise<void> {
    const { error } = await this.supabase.from("ilist_config").upsert(config);

    if (error) {
      throw new Error(`Failed to update iList config: ${error.message}`);
    }
  }

  /**
   * Get iList configuration
   */
  async getIListConfig(): Promise<any> {
    const { data, error } = await this.supabase
      .from("ilist_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get iList config: ${error.message}`);
    }

    return data;
  }

  /**
   * Refresh materialized view
   */
  async refreshPropertySearchView(): Promise<void> {
    const { error } = await this.supabase.rpc("refresh_materialized_view", {
      view_name: "property_search_optimized",
    });

    if (error) {
      console.error("Error refreshing materialized view:", error);
    }
  }

  /**
   * Get the Supabase client instance for direct queries
   */
  getSupabase() {
    return this.supabase;
  }
}

/**
 * Create Supabase service instance
 */
export function createSupabaseService(
  supabaseUrl: string,
  supabaseKey: string,
): SupabaseService {
  return new SupabaseService(supabaseUrl, supabaseKey);
}
