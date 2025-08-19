/**
 * Property Inquiry API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const body = await request.json();

    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || "";
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Extract IP address (handle various proxy headers)
    const ipAddress =
      cfConnectingIp ||
      xRealIp ||
      (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) ||
      "127.0.0.1";

    const referrer = request.headers.get("referer") || "";

    // Initialize Supabase service
    const supabaseService = createSupabaseService(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Verify property exists
    const property = await supabaseService.getPropertyById(propertyId);
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    // Create inquiry
    const inquiryId = await supabaseService.createPropertyInquiry({
      property_id: propertyId,
      name,
      email,
      phone,
      message,
      source: "website",
      user_agent: userAgent,
      ip_address: ipAddress,
      referrer,
      status: "new",
    });

    // TODO: Send notification email to property partner
    // TODO: Optionally send lead to iList CRM if they have lead API

    return NextResponse.json({
      success: true,
      inquiryId,
      message: "Your inquiry has been submitted successfully",
    });
  } catch (error) {
    console.error("Inquiry creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit inquiry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
