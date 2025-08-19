/**
 * Analytics API Route
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
    const period = url.searchParams.get("period") || "30"; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Get property analytics
    const { data: properties } = await supabaseService
      .getSupabase()
      .from("properties")
      .select("*")
      .gte("created_at", startDate.toISOString());

    // Get sync session analytics
    const { data: syncSessions } = await supabaseService
      .getSupabase()
      .from("ilist_sync_sessions")
      .select("*")
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false });

    // Get inquiry analytics
    const { data: inquiries } = await supabaseService
      .getSupabase()
      .from("property_inquiries")
      .select("*, properties!inner(price, area_id)")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    // Get total counts
    const [
      { count: totalProperties },
      { count: totalInquiries },
      { count: totalSyncSessions }
    ] = await Promise.all([
      supabaseService.getSupabase().from("properties").select("*", { count: "exact", head: true }),
      supabaseService.getSupabase().from("property_inquiries").select("*", { count: "exact", head: true }),
      supabaseService.getSupabase().from("ilist_sync_sessions").select("*", { count: "exact", head: true })
    ]);

    // Calculate property metrics
    const propertyMetrics = {
      total: totalProperties || 0,
      newInPeriod: properties?.length || 0,
      averagePrice: properties && properties.length > 0 
        ? Math.round(properties.reduce((acc: number, p: any) => acc + (p.price || 0), 0) / properties.length)
        : 0,
      priceRange: {
        min: properties && properties.length > 0 
          ? Math.min(...properties.map((p: any) => p.price || 0))
          : 0,
        max: properties && properties.length > 0 
          ? Math.max(...properties.map((p: any) => p.price || 0))
          : 0,
      },
      byStatus: {
        active: properties?.filter((p: any) => p.status_id === 1).length || 0,
        inactive: properties?.filter((p: any) => p.status_id !== 1).length || 0,
      },
      byArea: {} as Record<string, number>
    };

    // Calculate area distribution
    if (properties) {
      properties.forEach((p: any) => {
        if (p.area_id) {
          const areaId = p.area_id.toString();
          propertyMetrics.byArea[areaId] = (propertyMetrics.byArea[areaId] || 0) + 1;
        }
      });
    }

    // Calculate sync metrics
    const syncMetrics = {
      total: totalSyncSessions || 0,
      inPeriod: syncSessions?.length || 0,
      successful: syncSessions?.filter((s: any) => s.status === "completed").length || 0,
      failed: syncSessions?.filter((s: any) => s.status === "failed").length || 0,
      averageDuration: syncSessions && syncSessions.length > 0
        ? Math.round(syncSessions
            .filter((s: any) => s.duration_seconds)
            .reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0) / 
            syncSessions.filter((s: any) => s.duration_seconds).length)
        : 0,
      totalPropertiesProcessed: syncSessions?.reduce((acc: number, s: any) => acc + (s.total_properties || 0), 0) || 0,
      totalPropertiesAdded: syncSessions?.reduce((acc: number, s: any) => acc + (s.new_properties || 0), 0) || 0,
      totalPropertiesUpdated: syncSessions?.reduce((acc: number, s: any) => acc + (s.updated_properties || 0), 0) || 0,
      lastSyncStatus: syncSessions?.[0]?.status || "never",
      recentSessions: syncSessions?.slice(0, 10) || []
    };

    // Calculate inquiry metrics
    const inquiryMetrics = {
      total: totalInquiries || 0,
      inPeriod: inquiries?.length || 0,
      conversionRate: inquiries && inquiries.length > 0
        ? Math.round((inquiries.filter((i: any) => i.status === "converted").length / inquiries.length) * 100)
        : 0,
      byStatus: {
        new: inquiries?.filter((i: any) => i.status === "new").length || 0,
        contacted: inquiries?.filter((i: any) => i.status === "contacted").length || 0,
        converted: inquiries?.filter((i: any) => i.status === "converted").length || 0,
        closed: inquiries?.filter((i: any) => i.status === "closed").length || 0,
      },
      bySource: {} as Record<string, number>,
      averagePropertyPrice: inquiries && inquiries.length > 0
        ? Math.round(inquiries.reduce((acc: number, i: any) => acc + (i.properties?.price || 0), 0) / inquiries.length)
        : 0,
      topAreas: {} as Record<string, number>
    };

    // Calculate inquiry source distribution
    if (inquiries) {
      inquiries.forEach((i: any) => {
        const source = i.source || "unknown";
        inquiryMetrics.bySource[source] = (inquiryMetrics.bySource[source] || 0) + 1;
        
        if (i.properties?.area_id) {
          const areaId = i.properties.area_id.toString();
          inquiryMetrics.topAreas[areaId] = (inquiryMetrics.topAreas[areaId] || 0) + 1;
        }
      });
    }

    // Generate time series data for charts
    const dailyData = generateDailyTimeSeries(parseInt(period), {
      properties: properties || [],
      inquiries: inquiries || [],
      syncSessions: syncSessions || []
    });

    return NextResponse.json({
      success: true,
      data: {
        period: parseInt(period),
        metrics: {
          properties: propertyMetrics,
          sync: syncMetrics,
          inquiries: inquiryMetrics,
        },
        charts: {
          daily: dailyData,
        }
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function generateDailyTimeSeries(days: number, data: {
  properties: any[];
  inquiries: any[];
  syncSessions: any[];
}) {
  const result = [];
  const endDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = {
      date: dateStr,
      properties: data.properties.filter((p: any) => 
        p.created_at?.split('T')[0] === dateStr
      ).length,
      inquiries: data.inquiries.filter((i: any) => 
        i.created_at?.split('T')[0] === dateStr
      ).length,
      syncSessions: data.syncSessions.filter((s: any) => 
        s.started_at?.split('T')[0] === dateStr
      ).length,
      conversions: data.inquiries.filter((i: any) => 
        i.created_at?.split('T')[0] === dateStr && i.status === 'converted'
      ).length,
    };
    
    result.push(dayData);
  }
  
  return result;
}