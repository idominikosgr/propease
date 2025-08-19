/**
 * User Preferences API Route
 * Handles saved searches, property alerts, and user settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("clerk_user_id", userId)
      .single();

    // Get saved searches
    const { data: savedSearches, error: searchError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false });

    // Get property alerts
    const { data: alerts, error: alertError } = await supabase
      .from("property_alerts")
      .select("*")
      .eq("clerk_user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (prefError || searchError || alertError) {
      throw new Error("Failed to fetch user data");
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: preferences || {},
        savedSearches: savedSearches || [],
        alerts: alerts || []
      }
    });

  } catch (error) {
    console.error("User preferences fetch error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user preferences",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    const supabase = await createSupabaseServerClient();

    switch (type) {
      case "save_search":
        const { data: savedSearch, error: saveError } = await supabase
          .from("saved_searches")
          .insert({
            clerk_user_id: userId,
            name: data.name,
            filters: data.filters,
            results_count: data.resultsCount || 0
          })
          .select()
          .single();

        if (saveError) throw saveError;

        return NextResponse.json({
          success: true,
          data: savedSearch
        });

      case "create_alert":
        const { data: alert, error: alertError } = await supabase
          .from("property_alerts")
          .insert({
            clerk_user_id: userId,
            name: data.name,
            filters: data.filters,
            email_notifications: data.emailNotifications || true,
            frequency: data.frequency || "daily"
          })
          .select()
          .single();

        if (alertError) throw alertError;

        return NextResponse.json({
          success: true,
          data: alert
        });

      case "update_preferences":
        const { data: updatedPrefs, error: updateError } = await supabase
          .from("user_preferences")
          .upsert({
            clerk_user_id: userId,
            language: data.language || "en",
            email_notifications: data.emailNotifications || true,
            sms_notifications: data.smsNotifications || false,
            currency: data.currency || "EUR",
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          data: updatedPrefs
        });

      default:
        return NextResponse.json(
          { error: "Invalid request type" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("User preferences update error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user preferences",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id parameter" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    switch (type) {
      case "saved_search":
        const { error: deleteSearchError } = await supabase
          .from("saved_searches")
          .delete()
          .eq("id", id)
          .eq("clerk_user_id", userId);

        if (deleteSearchError) throw deleteSearchError;
        break;

      case "alert":
        const { error: deleteAlertError } = await supabase
          .from("property_alerts")
          .update({ active: false })
          .eq("id", id)
          .eq("clerk_user_id", userId);

        if (deleteAlertError) throw deleteAlertError;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid delete type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully"
    });

  } catch (error) {
    console.error("User preferences delete error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}