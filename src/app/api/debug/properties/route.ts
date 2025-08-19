/**
 * Debug Properties API Route
 * Direct database queries for debugging import issues
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has admin role
    const client = await (await import("@clerk/nextjs/server")).clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== "admin" && userRole !== "agent") {
      return NextResponse.json(
        { error: "Admin or agent access required" },
        { status: 403 },
      );
    }

    const supabase = await createSupabaseServiceClient();

    // Get raw properties data
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (propertiesError) {
      throw propertiesError;
    }

    // Get sync sessions
    const { data: syncSessions, error: syncError } = await supabase
      .from("ilist_sync_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);

    if (syncError) {
      throw syncError;
    }

    // Get properties count
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    // Get materialized view count
    const { count: viewProperties } = await supabase
      .from("property_search_optimized")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      debug: {
        totalProperties: totalProperties || 0,
        viewProperties: viewProperties || 0,
        recentProperties: properties || [],
        recentSyncSessions: syncSessions || [],
      },
    });
  } catch (error) {
    console.error("Debug properties error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get debug info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
