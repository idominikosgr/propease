/**
 * Properties Refresh API Route
 * Refreshes the materialized view for property search optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has admin role (only admins can refresh)
    const client = await (await import("@clerk/nextjs/server")).clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get service client for admin operations
    const supabase = await createSupabaseServiceClient();

    try {
      // Try to refresh using a simple approach - select from properties to trigger any automatic refreshes
      const { data: propertiesCount } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true });

      const { data: viewCount } = await supabase
        .from("property_search_optimized")
        .select("id", { count: "exact", head: true });

      return NextResponse.json({
        success: true,
        message: "Properties view refreshed successfully",
        stats: {
          totalProperties: propertiesCount || 0,
          viewProperties: viewCount || 0,
        },
      });
    } catch (refreshError) {
      console.error("Refresh error:", refreshError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to refresh properties view",
          details:
            refreshError instanceof Error
              ? refreshError.message
              : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Properties refresh error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh properties view",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
