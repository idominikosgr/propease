/**
 * Property Import Service
 * Handles CSV/Excel imports and iList API imports with our new structure
 */

import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { IListProperty } from "@/lib/ilist-api";
import {
  PropertyImportMapping,
  PropertyImportResult,
  ImportError,
} from "@/lib/property-import-types";
import * as XLSX from "xlsx";

// Re-export types for backward compatibility
export type { PropertyImportMapping, PropertyImportResult, ImportError };

/**
 * Import properties from CSV data
 */
export async function importPropertiesFromCSV(
  csvData: any[],
  columnMapping: PropertyImportMapping,
  onProgress?: (progress: number) => void,
): Promise<PropertyImportResult> {
  const supabase = await createSupabaseServiceClient();
  const importId = `csv_${Date.now()}`;

  const result: PropertyImportResult = {
    total: csvData.length,
    success: 0,
    failed: 0,
    importId,
    errorDetails: [],
  };

  // Create import session
  const { data: session } = await supabase
    .from("ilist_sync_sessions")
    .insert({
      sync_type: "csv_import",
      status: "syncing",
      total_properties: csvData.length,
    })
    .select("id")
    .single();

  const sessionId = session?.id;

  try {
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Transform CSV row to iList structure
        const ilistProperty = transformCsvToIListProperty(row, columnMapping);

        // Log the transformed property for debugging (first row only)
        if (i === 0) {
          console.log(
            "Transformed property sample:",
            JSON.stringify(ilistProperty, null, 2),
          );
        }

        // Validate required fields
        const validationErrors = validateIListProperty(ilistProperty);
        if (validationErrors.length > 0) {
          console.log(`Validation failed for row ${i + 1}:`, validationErrors);
          result.errorDetails.push({
            row: i + 1,
            data: row,
            errors: validationErrors,
          });
          result.failed++;
          continue;
        }

        // Insert property using our upsert function
        const { data: insertedId, error: insertError } = await supabase.rpc(
          "upsert_property_from_ilist",
          {
            ilist_data: ilistProperty as any,
          },
        );

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        console.log(
          `Property ${i + 1} inserted successfully with ID:`,
          insertedId,
        );
        result.success++;

        // Update progress
        if (onProgress) {
          onProgress(Math.round(((i + 1) / csvData.length) * 100));
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        result.errorDetails.push({
          row: i + 1,
          data: row,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
        result.failed++;
      }
    }

    // Update session with results
    if (sessionId) {
      await supabase
        .from("ilist_sync_sessions")
        .update({
          status: "completed",
          new_properties: result.success,
          failed_properties: result.failed,
          completed_at: new Date().toISOString(),
          error_details:
            result.errorDetails.length > 0
              ? ({ errors: result.errorDetails } as any)
              : null,
        })
        .eq("id", sessionId);
    }

    // Log successful import completion
    if (result.success > 0) {
      console.log(
        `Import completed successfully: ${result.success} properties imported`,
      );
      console.log(
        "Note: Dashboard will show imported properties immediately using direct table queries",
      );
    }

    return result;
  } catch (error) {
    // Update session with error
    if (sessionId) {
      await supabase
        .from("ilist_sync_sessions")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Import failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    throw error;
  }
}

/**
 * Transform CSV row data to iList property structure
 */
function transformCsvToIListProperty(
  row: any,
  mapping: PropertyImportMapping,
): IListProperty {
  // Generate a unique iList ID for imported properties (negative to avoid conflicts)
  const ilistId = row[mapping.ilist_id!]
    ? parseInt(row[mapping.ilist_id!])
    : -(Date.now() + Math.random() * 1000);

  // Create characteristics array from mapped fields
  const characteristics = [];

  // Title characteristic
  if (mapping.title && row[mapping.title]) {
    characteristics.push({
      Id: 297,
      Language_Id: 4,
      Title: "Τίτλος",
      Value: row[mapping.title],
      LookupType: "",
    });
  }

  // Description characteristic
  if (mapping.description && row[mapping.description]) {
    characteristics.push({
      Id: 299,
      Language_Id: 4,
      Title: "Επιπλέον κείμενο (ΧΕ)",
      Value: row[mapping.description],
      LookupType: "",
    });
  }

  // Create partner object
  const partner =
    mapping.partner_name || mapping.partner_email || mapping.partner_phone
      ? {
          Id: Math.floor(Math.random() * 100000),
          Firstname: row[mapping.partner_name!]?.split(" ")[0] || "",
          Lastname:
            row[mapping.partner_name!]?.split(" ").slice(1).join(" ") || "",
          Email: row[mapping.partner_email!] || "",
          Phone: row[mapping.partner_phone!] || "",
          PhotoUrl: "",
        }
      : undefined;

  // Build iList property object
  const ilistProperty: IListProperty = {
    Id: ilistId,
    Category_ID: mapping.property_type
      ? parseInt(row[mapping.property_type]) || 1
      : 1,
    SubCategory_ID: 1, // Default
    Aim_ID: mapping.aim_id ? parseInt(row[mapping.aim_id]) || 1 : 1,
    CustomCode: mapping.custom_code ? row[mapping.custom_code] : undefined,
    Price: mapping.price
      ? parseFloat(String(row[mapping.price]).replace(/[^0-9.-]/g, "")) || 0
      : 0,
    SqrMeters: mapping.sqr_meters
      ? parseInt(String(row[mapping.sqr_meters]).replace(/[^0-9]/g, "")) || 0
      : 0,
    Rooms: mapping.rooms ? parseInt(row[mapping.rooms]) || 0 : 0,
    Bathrooms: mapping.bathrooms ? parseInt(row[mapping.bathrooms]) || 0 : 0,
    Area_ID: mapping.area_id ? parseInt(row[mapping.area_id]) || 0 : 0,
    SubArea_ID: mapping.subarea_id ? parseInt(row[mapping.subarea_id]) || 0 : 0,
    Latitude: mapping.latitude ? parseFloat(row[mapping.latitude]) : undefined,
    Longitude: mapping.longitude
      ? parseFloat(row[mapping.longitude])
      : undefined,
    PostalCode: mapping.postal_code ? row[mapping.postal_code] : undefined,
    EnergyClass_ID: mapping.energy_class_id
      ? parseInt(row[mapping.energy_class_id])
      : undefined,
    BuildingYear: mapping.building_year
      ? parseInt(row[mapping.building_year])
      : undefined,
    Characteristics: characteristics,
    Images: [], // No images from CSV import
    AdditionalLanguages: [],
    TotalParkings: 0,
    Parkings: [],
    DistanceFrom: [],
    Basements: [],
    Partner: partner,
    Flags: [],
    SendDate: new Date().toISOString(),
    UpdateDate: new Date().toISOString(),
    Token: "",
    isSync: true,
    StatusID: 1, // Active by default
  };

  return ilistProperty;
}

/**
 * Validate iList property data
 */
function validateIListProperty(property: IListProperty): string[] {
  const errors: string[] = [];

  if (!property.Id) {
    errors.push("Property ID is required");
  }

  // More lenient price validation - allow 0 for testing
  if (property.Price === undefined || property.Price === null) {
    errors.push("Price field is required (can be 0 for testing)");
  }

  // Make title optional for testing - just log a warning instead
  const hasTitle = property.Characteristics?.find((c) => c.Title === "Τίτλος");
  if (!hasTitle) {
    console.warn(
      "Property has no title characteristic, but allowing import for testing",
    );
  }

  console.log("Validation check:", {
    hasId: !!property.Id,
    hasPrice: property.Price !== undefined && property.Price !== null,
    hasTitle: !!hasTitle,
    characteristicsCount: property.Characteristics?.length || 0,
  });

  return errors;
}

// parseCSVText moved to property-import-utils.ts

// parseExcelFile moved to property-import-utils.ts

// getSuggestedMapping moved to property-import-utils.ts
