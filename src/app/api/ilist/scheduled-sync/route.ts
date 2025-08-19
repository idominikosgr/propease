/**
 * Scheduled Sync API Route
 * For automated synchronization (can be called by cron jobs)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSyncService } from "@/lib/sync-service";
import { createSupabaseService } from "@/lib/supabase-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET || "your-cron-secret";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const providedSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      syncType = "incremental",
      includeDeleted = true,
      batchSize = 10,
    } = body;

    // Get iList configuration
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );
    const ilistConfig = await supabaseService.getIListConfig();

    if (!ilistConfig || !ilistConfig.auth_token) {
      return NextResponse.json(
        { error: "iList API not configured" },
        { status: 400 },
      );
    }

    // Get last sync date for incremental sync
    let lastSyncDate: Date | undefined;
    if (syncType === "incremental") {
      const latestSession = await supabaseService.getLatestSyncSession();
      if (latestSession?.completed_at) {
        lastSyncDate = new Date(latestSession.completed_at);
      }
    }

    // Perform sync
    const syncService = createSyncService(supabaseUrl, supabaseServiceKey);
    const result = await syncService.performSync({
      authToken: ilistConfig.auth_token,
      syncType,
      includeDeleted,
      lastSyncDate,
      batchSize,
    });

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scheduled sync error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Scheduled sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return sync status and schedule info
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );
    const syncService = createSyncService(supabaseUrl, supabaseServiceKey);

    const stats = await syncService.getSyncStats();

    return NextResponse.json({
      success: true,
      ...stats,
      schedule: {
        recommended: "Every 15 minutes during business hours",
        endpoint: "/api/ilist/scheduled-sync",
        method: "POST",
        headers: {
          "x-cron-secret": "your-cron-secret",
          "Content-Type": "application/json",
        },
        payload: {
          syncType: "incremental",
          includeDeleted: true,
          batchSize: 10,
        },
      },
    });
  } catch (error) {
    console.error("Error getting scheduled sync status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get sync status",
      },
      { status: 500 },
    );
  }
}
