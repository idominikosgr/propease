/**
 * Property Inquiries Management API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseService } from "@/lib/supabase-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const propertyId = url.searchParams.get("propertyId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search");
    const assignedTo = url.searchParams.get("assignedTo");

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Build query
    let query = supabaseService
      .getSupabase()
      .from("property_inquiries")
      .select(`
        *,
        properties!inner (
          id,
          ilist_id,
          custom_code,
          price,
          area_id
        )
      `);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }
    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%,properties.custom_code.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: inquiries, error: inquiriesError } = await query;

    if (inquiriesError) {
      throw new Error(`Failed to fetch inquiries: ${inquiriesError.message}`);
    }

    // Get total count for pagination
    let countQuery = supabaseService
      .getSupabase()
      .from("property_inquiries")
      .select("id", { count: "exact", head: true });

    // Apply same filters for count
    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status);
    }
    if (propertyId) {
      countQuery = countQuery.eq("property_id", propertyId);
    }
    if (assignedTo) {
      countQuery = countQuery.eq("assigned_to", assignedTo);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Count query error:", countError);
    }

    // Get inquiry statistics
    const { data: stats } = await supabaseService
      .getSupabase()
      .from("property_inquiries")
      .select("status, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const inquiryStats = {
      total: count || 0,
      new: stats?.filter((s: any) => s.status === "new").length || 0,
      contacted: stats?.filter((s: any) => s.status === "contacted").length || 0,
      converted: stats?.filter((s: any) => s.status === "converted").length || 0,
      closed: stats?.filter((s: any) => s.status === "closed").length || 0,
      thisMonth: stats?.filter(
        (s: any) => new Date(s.created_at).getMonth() === new Date().getMonth()
      ).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: inquiries || [],
      total: count || 0,
      stats: inquiryStats,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Inquiries fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch inquiries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inquiryId, status, assignedTo, notes } = body;

    if (!inquiryId) {
      return NextResponse.json(
        { error: "Inquiry ID is required" },
        { status: 400 },
      );
    }

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Update inquiry
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    const { error } = await supabaseService
      .getSupabase()
      .from("property_inquiries")
      .update(updateData)
      .eq("id", inquiryId);

    if (error) {
      throw new Error(`Failed to update inquiry: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry updated successfully",
    });
  } catch (error) {
    console.error("Inquiry update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update inquiry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}