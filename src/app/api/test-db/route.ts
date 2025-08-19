import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServiceClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from("properties")
      .select("count(*)")
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: "Database query failed",
        details: error.message,
        code: error.code
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}