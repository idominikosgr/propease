/**
 * Lead Generation API Route
 * Handles lead capture and CRM integration
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      inquiryType,
      budget,
      timeline,
      preferredContact,
      message,
      goldenVisaInterest,
      propertyTypes,
      areas,
      newsletter,
      whatsapp,
      propertyId,
      propertyTitle,
      propertyPrice,
      propertyArea,
      source,
      timestamp,
      userAgent,
      referrer,
    } = body

    // Validate required fields
    if (!(firstName && lastName && email && inquiryType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Create lead record
    const leadData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      country: country || null,
      inquiry_type: inquiryType,
      budget: budget || null,
      timeline: timeline || null,
      preferred_contact: preferredContact || 'email',
      message: message || null,
      golden_visa_interest: goldenVisaInterest,
      property_types: propertyTypes || [],
      preferred_areas: areas || [],
      newsletter_subscription: newsletter,
      whatsapp_available: whatsapp,
      property_id: propertyId || null,
      property_title: propertyTitle || null,
      property_price: propertyPrice || null,
      property_area: propertyArea || null,
      source: source || 'general_inquiry',
      user_agent: userAgent || null,
      referrer: referrer || null,
      status: 'new',
      priority: calculatePriority(inquiryType, budget, timeline, goldenVisaInterest),
      created_at: timestamp || new Date().toISOString(),
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (leadError) {
      throw leadError
    }

    // Send immediate acknowledgment email (in production, this would trigger an email service)
    console.log('Lead captured:', {
      id: lead.id,
      name: `${firstName} ${lastName}`,
      email,
      inquiry: inquiryType,
      property: propertyTitle || 'General inquiry',
    })

    // Trigger notifications to sales team (in production)
    await triggerSalesNotification(lead)

    // Auto-assign lead based on inquiry type and area
    await autoAssignLead(lead, supabase)

    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: "Your inquiry has been submitted successfully. We'll contact you within 24 hours.",
      },
    })
  } catch (error) {
    console.error('Lead submission error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit inquiry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate lead priority
function calculatePriority(
  inquiryType: string,
  budget: string,
  timeline: string,
  goldenVisa: boolean
): 'high' | 'medium' | 'low' {
  let score = 0

  // Inquiry type scoring
  if (inquiryType === 'buying' || inquiryType === 'investment') score += 3
  else if (inquiryType === 'golden_visa') score += 4
  else if (inquiryType === 'consultation') score += 2
  else score += 1

  // Budget scoring
  if (budget === 'over_2m') score += 4
  else if (budget === '1m_2m') score += 3
  else if (budget === '500k_1m') score += 2
  else if (budget === '250k_500k') score += 1

  // Timeline scoring
  if (timeline === 'immediate') score += 3
  else if (timeline === '3_months') score += 2
  else if (timeline === '6_months') score += 1

  // Golden Visa interest adds significant value
  if (goldenVisa) score += 3

  // Determine priority
  if (score >= 8) return 'high'
  else if (score >= 4) return 'medium'
  else return 'low'
}

// Helper function to trigger sales team notifications
async function triggerSalesNotification(lead: any) {
  // In production, this would:
  // 1. Send email to sales team
  // 2. Create Slack notification
  // 3. Update CRM system
  // 4. Send SMS for high-priority leads

  console.log('Sales notification triggered for lead:', lead.id)

  // For now, just log the notification
  const notification = {
    type: 'new_lead',
    priority: lead.priority,
    lead: {
      id: lead.id,
      name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      inquiry: lead.inquiry_type,
      budget: lead.budget,
      timeline: lead.timeline,
    },
    timestamp: new Date().toISOString(),
  }

  console.log('Notification:', notification)
}

// Helper function to auto-assign leads
async function autoAssignLead(lead: any, supabase: any) {
  try {
    // Simple round-robin assignment based on inquiry type
    // In production, this would be more sophisticated

    let assignedAgent = null

    if (lead.golden_visa_interest || lead.inquiry_type === 'golden_visa') {
      // Assign to Golden Visa specialist
      assignedAgent = 'golden_visa_specialist'
    } else if (lead.inquiry_type === 'investment') {
      // Assign to investment specialist
      assignedAgent = 'investment_specialist'
    } else {
      // Assign to general sales team
      assignedAgent = 'general_sales'
    }

    // Update lead with assignment
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        assigned_to: assignedAgent,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Error assigning lead:', updateError)
    } else {
      console.log(`Lead ${lead.id} assigned to ${assignedAgent}`)
    }
  } catch (error) {
    console.error('Auto-assignment error:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: lead,
    })
  } catch (error) {
    console.error('Lead fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
