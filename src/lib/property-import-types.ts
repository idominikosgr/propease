/**
 * Property Import Types
 * Shared types for property import functionality
 */

export interface PropertyImportMapping {
  // Map CSV columns to iList structure
  ilist_id?: string
  title?: string
  description?: string
  property_type?: string
  aim_id?: string // 1=sale, 2=rent
  price?: string
  sqr_meters?: string
  rooms?: string
  bathrooms?: string
  area_id?: string
  subarea_id?: string
  energy_class_id?: string
  building_year?: string
  latitude?: string
  longitude?: string
  postal_code?: string
  custom_code?: string
  partner_name?: string
  partner_email?: string
  partner_phone?: string
  [key: string]: string | undefined
}

export interface PropertyImportResult {
  total: number
  success: number
  failed: number
  importId: string
  errorDetails: ImportError[]
}

export interface ImportError {
  row: number
  data: any
  errors: string[]
}
