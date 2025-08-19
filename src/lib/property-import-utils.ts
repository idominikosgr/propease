/**
 * Property Import Client Utilities
 * Client-safe functions for parsing files and mapping columns
 */

import type { PropertyImportMapping } from '@/lib/property-import-types'
import * as XLSX from 'xlsx'

/**
 * Parse CSV text into array of objects
 */
export function parseCSVText(csvText: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // Simple CSV parser - in production you might want to use a library like papaparse
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      reject(new Error('CSV must contain headers and at least one data row'))
      return
    }

    const headers = lines[0].split(',').map((h, index) => {
      const cleaned = h.trim().replace(/"/g, '')
      return cleaned || `Column ${index + 1}`
    })

    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      data.push(row)
    }

    resolve(data)
  })
}

/**
 * Parse Excel file into array of objects
 */
export function parseExcelFile(file: File): Promise<{ data: any[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('No data read from file'))
          return
        }

        // Parse Excel file
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain headers and at least one data row'))
          return
        }

        const headers = (jsonData[0] as any[]).map(
          (h, index) => String(h).trim() || `Column ${index + 1}`
        )

        const rows = jsonData.slice(1).map((row: any) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = String((row as any[])[index] || '').trim()
          })
          return obj
        })

        resolve({ data: rows, headers })
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Get suggested column mapping based on header names
 */
export function getSuggestedMapping(headers: string[]): PropertyImportMapping {
  const mapping: PropertyImportMapping = {}

  // Common mapping patterns
  const patterns: Record<string, string[]> = {
    ilist_id: ['id', 'property_id', 'ilist_id', 'property id'],
    title: ['title', 'name', 'property_name', 'property name'],
    description: ['description', 'desc', 'details', 'property_description'],
    price: ['price', 'cost', 'amount', 'value'],
    sqr_meters: ['sqr_meters', 'size', 'area', 'square_meters', 'sq_m', 'sqm'],
    rooms: ['rooms', 'bedrooms', 'bed_rooms', 'room_count'],
    bathrooms: ['bathrooms', 'bath', 'bathroom_count', 'baths'],
    area_id: ['area', 'location', 'area_id', 'neighborhood'],
    subarea_id: ['subarea', 'sub_area', 'subarea_id', 'district'],
    latitude: ['lat', 'latitude', 'y', 'coord_y'],
    longitude: ['lng', 'lon', 'longitude', 'x', 'coord_x'],
    postal_code: ['postal_code', 'zip', 'postcode', 'zip_code'],
    building_year: ['year', 'built_year', 'construction_year', 'building_year'],
    energy_class_id: ['energy_class', 'energy', 'efficiency'],
    custom_code: ['code', 'ref', 'reference', 'custom_code'],
    partner_name: ['agent', 'partner', 'contact_name', 'agent_name'],
    partner_email: ['email', 'agent_email', 'contact_email'],
    partner_phone: ['phone', 'tel', 'telephone', 'agent_phone', 'contact_phone'],
  }

  // Normalize headers for comparison
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

  // Try to match headers to fields
  Object.keys(patterns).forEach((field) => {
    const fieldPatterns = patterns[field]

    for (const header of normalizedHeaders) {
      for (const pattern of fieldPatterns) {
        if (header.includes(pattern) || pattern.includes(header)) {
          mapping[field as keyof PropertyImportMapping] = headers[normalizedHeaders.indexOf(header)]
          break
        }
      }

      if (mapping[field as keyof PropertyImportMapping]) {
        break
      }
    }
  })

  return mapping
}
