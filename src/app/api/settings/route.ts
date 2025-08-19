/**
 * System Settings API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseService } from "@/lib/supabase-service";
import { isAdmin } from "@/lib/clerk-roles";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    // Check required environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables:", {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        { 
          error: "Server configuration error: Missing Supabase environment variables. Please check your .env file." 
        },
        { status: 500 }
      );
    }
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Get current iList configuration
    const ilistConfig = await supabaseService.getIListConfig();

    // Get system environment settings
    const systemSettings = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      vercelUrl: process.env.VERCEL_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    // Get webhook configuration
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const webhookConfig = {
      webhookUrl: `${baseUrl}/api/webhooks/ilist`,
      supportedEvents: [
        "property.created",
        "property.updated",
        "property.deleted",
        "property.status_changed",
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        ilist: ilistConfig || {
          auth_token: "",
          base_url: "https://ilist.e-agents.gr/api/v1",
          sync_interval: 15,
          is_active: true,
        },
        webhook: webhookConfig,
        system: systemSettings,
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { section, settings } = body;

    if (!section || !settings) {
      return NextResponse.json(
        { error: "Section and settings are required" },
        { status: 400 },
      );
    }

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    let result;

    switch (section) {
      case "ilist":
        // Validate required fields
        if (!settings.base_url) {
          return NextResponse.json(
            { error: "Base URL is required for iList configuration" },
            { status: 400 },
          );
        }

        // Update iList configuration
        await supabaseService.updateIListConfig({
          auth_token: settings.auth_token || "",
          api_base_url: settings.base_url,
          is_active: settings.is_active !== undefined ? settings.is_active : true,
        });

        result = {
          section: "ilist",
          message: "iList configuration updated successfully",
          settings,
        };
        break;

      case "webhook":
        // Webhook configuration is mostly read-only (based on environment)
        // But we could store preferences or secrets
        result = {
          section: "webhook",
          message: "Webhook configuration noted (mostly environment-based)",
          settings,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown settings section: ${section}` },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Settings update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Test iList connection with current or provided settings
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, authToken, baseUrl } = body;

    if (action === "test_connection") {
      if (!authToken) {
        return NextResponse.json(
          { error: "Auth token is required for connection test" },
          { status: 400 },
        );
      }

      try {
        const testUrl = `${baseUrl || "https://ilist.e-agents.gr/api/v1"}/properties`;
        
        // Test the connection
        const response = await fetch(testUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          return NextResponse.json({
            success: true,
            connected: true,
            message: "iList connection successful",
            status: response.status,
          });
        } else {
          return NextResponse.json({
            success: false,
            connected: false,
            message: `Connection failed: ${response.status} ${response.statusText}`,
            status: response.status,
          });
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          connected: false,
          message: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Settings action error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}