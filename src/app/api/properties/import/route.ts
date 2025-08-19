/**
 * Property Import API Route
 * Handles CSV/Excel imports and converts to iList structure
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { importPropertiesFromCSV } from "@/lib/property-import-service";
import { parseCSVText, parseExcelFile } from "@/lib/property-import-utils";
import { PropertyImportMapping } from "@/lib/property-import-types";

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

    // Check if user has agent or admin role
    const client = await (await import("@clerk/nextjs/server")).clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== "admin" && userRole !== "agent") {
      return NextResponse.json(
        { error: "Agent or admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { csvData, columnMapping, importType } = body;

    if (!csvData || !columnMapping) {
      return NextResponse.json(
        { error: "CSV data and column mapping are required" },
        { status: 400 },
      );
    }

    let parsedData: any[];

    if (importType === "csv_text") {
      // Parse CSV text
      parsedData = await parseCSVText(csvData);
    } else {
      // Assume already parsed data
      parsedData = csvData;
    }

    // Import properties
    const result = await importPropertiesFromCSV(parsedData, columnMapping);

    return NextResponse.json({
      ...result,
      message: `Import completed: ${result.success} successful, ${result.failed} failed`,
      debug: {
        parsedDataSample: parsedData.slice(0, 2), // First 2 rows for debugging
        columnMapping,
        importType,
      },
    });
  } catch (error) {
    console.error("Import error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has agent or admin role
    const client = await (await import("@clerk/nextjs/server")).clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string;

    if (userRole !== "admin" && userRole !== "agent") {
      return NextResponse.json(
        { error: "Agent or admin access required" },
        { status: 403 },
      );
    }

    // Return import template and field mappings
    return NextResponse.json({
      success: true,
      supportedFields: [
        { id: "ilist_id", name: "iList ID", required: false },
        { id: "title", name: "Property Title", required: true },
        { id: "description", name: "Description", required: false },
        { id: "price", name: "Price (€)", required: true },
        { id: "sqr_meters", name: "Size (m²)", required: false },
        { id: "rooms", name: "Rooms", required: false },
        { id: "bathrooms", name: "Bathrooms", required: false },
        { id: "area_id", name: "Area ID", required: false },
        { id: "subarea_id", name: "Subarea ID", required: false },
        { id: "energy_class_id", name: "Energy Class ID", required: false },
        { id: "building_year", name: "Building Year", required: false },
        { id: "latitude", name: "Latitude", required: false },
        { id: "longitude", name: "Longitude", required: false },
        { id: "postal_code", name: "Postal Code", required: false },
        { id: "partner_name", name: "Agent Name", required: false },
        { id: "partner_email", name: "Agent Email", required: false },
        { id: "partner_phone", name: "Agent Phone", required: false },
      ],
      csvTemplate: [
        "title,price,sqr_meters,rooms,bathrooms,area_id,description",
        "Beautiful Apartment,250000,85,2,1,2011,Modern apartment in great location",
        "Luxury Villa,590000,290,4,3,2208,Stunning villa with sea view",
      ].join("\n"),
    });
  } catch (error) {
    console.error("Error getting import info:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get import information",
      },
      { status: 500 },
    );
  }
}
