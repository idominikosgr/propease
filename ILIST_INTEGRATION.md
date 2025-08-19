# iList CRM Integration Guide

This document explains the complete iList CRM integration for your real estate platform with 100% functionality parity.

## Overview

Your platform now has complete integration with iList CRM that provides:

- **100% Data Parity**: All iList fields, characteristics, and metadata are preserved
- **Real-time Sync**: Webhooks for instant updates when properties change in iList
- **Bi-directional Flow**: Properties sync from iList to your site automatically
- **Status Management**: Active/inactive properties sync perfectly
- **Complete API**: Full REST API for property search and management

## Architecture

### Database Schema (`supabase/schema.sql`)

The database is designed to mirror iList's exact structure:

- **`properties`**: Main table with all iList fields (1:1 mapping)
- **`property_images`**: iList Images array structure
- **`property_characteristics`**: iList Characteristics with multi-language support
- **`property_partners`**: iList Partner information
- **`property_additional_languages`**: Multi-language content
- **`property_distances`**: Distance from places data
- **`property_parkings`**: Parking information
- **`ilist_sync_sessions`**: Sync tracking and monitoring
- **`ilist_lookups`**: All lookup data from iList API

### Key Features

1. **PostGIS Integration**: Spatial queries for location-based search
2. **Full-text Search**: Greek language search optimization
3. **Materialized Views**: Fast property search performance
4. **Row Level Security**: Public access to active properties only
5. **Automatic Triggers**: Location points, search vectors, timestamps

## API Endpoints

### Core iList Integration

#### Test Connection

```bash
POST /api/ilist/test-connection
{
  "authToken": "your-ilist-api-token"
}
```

#### Sync Properties

```bash
POST /api/ilist/sync
{
  "authToken": "your-ilist-api-token",
  "syncType": "incremental|full",
  "includeDeleted": true,
  "lastSyncDate": "2024-01-01T00:00:00Z"
}
```

#### Scheduled Sync (for cron jobs)

```bash
POST /api/ilist/scheduled-sync
Headers: { "x-cron-secret": "your-cron-secret" }
{
  "syncType": "incremental",
  "includeDeleted": true,
  "batchSize": 10
}
```

### Property Management

#### Search Properties

```bash
GET /api/properties?search=athens&minPrice=100000&maxPrice=500000&minRooms=2
```

#### Get Property Details

```bash
GET /api/properties/{id}
```

#### Property Status Management

```bash
PUT /api/properties/{id}/status
{
  "status_id": 1,  // 1=active, 2=inactive
  "authToken": "your-ilist-api-token"
}
```

#### Submit Property Inquiry

```bash
POST /api/properties/{id}/inquire
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+30 123 456 7890",
  "message": "Interested in this property"
}
```

### Webhook System

#### Webhook Endpoint (for iList to call)

```bash
POST /api/webhooks/ilist
Headers: { "x-webhook-secret": "your-webhook-secret" }
{
  "event": "property.updated",
  "property_id": 927748,
  "timestamp": "2024-01-01T12:00:00Z",
  "data": { /* full iList property object */ }
}
```

#### Configure Webhooks

```bash
POST /api/ilist/webhook-config
{
  "authToken": "your-ilist-api-token",
  "webhookUrl": "https://yoursite.com/api/webhooks/ilist",
  "events": ["property.created", "property.updated", "property.deleted"],
  "secret": "your-webhook-secret"
}
```

## Frontend Pages

### Dashboard (`/dashboard/properties`)

Property management dashboard with:

- Real-time sync status monitoring
- Property list with iList data
- Search and filtering
- Sync controls
- Connection testing

### Public Listings (`/properties`)

Public property search page with:

- Advanced search and filters
- Grid layout with images
- Property cards with key details
- Responsive design

### Property Details (`/properties/[id]`)

Individual property page with:

- Image gallery with navigation
- Complete property details from iList
- Agent contact information
- Inquiry form
- Location display
- All iList characteristics displayed

## Synchronization Flows

### 1. Initial Setup

1. Get iList API token from your iList account
2. Test connection via `/api/ilist/test-connection`
3. Run full sync via `/api/ilist/sync` with `syncType: "full"`
4. Configure webhooks for real-time updates

### 2. Real-time Updates (Webhook Flow)

```
iList CRM → Webhook → Your Site
```

1. Property created/updated/deleted in iList
2. iList calls your webhook endpoint
3. Your site immediately updates the property
4. Changes appear on your website instantly

### 3. Scheduled Sync (Backup)

```
Cron Job → Your Site → iList API → Database Update
```

1. Cron job calls `/api/ilist/scheduled-sync` every 15 minutes
2. Incremental sync checks for any missed updates
3. Ensures data consistency even if webhooks fail

### 4. Manual Sync (Dashboard)

```
Dashboard → Sync Button → iList API → Database Update
```

1. User clicks "Sync Now" in dashboard
2. Immediate sync with iList
3. Real-time progress tracking

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# iList Integration
ILIST_WEBHOOK_SECRET=your-webhook-secret-key
CRON_SECRET=your-cron-secret-for-scheduled-sync

# App
NEXTAUTH_URL=https://yoursite.com
```

## Setup Instructions

### 1. Database Setup

```bash
# Run the schema in your Supabase SQL editor
cat supabase/schema.sql | supabase db reset --db-url "your-database-url"
```

### 2. Install Dependencies

```bash
pnpm install @supabase/supabase-js
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

### 4. Setup Scheduled Sync (Optional)

Add to your hosting platform (Vercel, Railway, etc.):

```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/ilist/scheduled-sync",
    "schedule": "*/15 * * * *"
  }]
}
```

### 5. Configure iList Webhooks

In your iList CRM admin panel, configure webhook URL:

```
URL: https://yoursite.com/api/webhooks/ilist
Secret: your-webhook-secret
Events: property.created, property.updated, property.deleted, property.status_changed
```

## Data Flow Examples

### When a property is uploaded to iList:

1. Property created in iList CRM
2. iList sends webhook to `/api/webhooks/ilist` with `event: "property.created"`
3. Your site fetches full property data from iList API
4. Property is saved to Supabase with complete iList data structure
5. Property appears on your website immediately

### When a property is edited in iList:

1. Property updated in iList CRM
2. iList sends webhook with `event: "property.updated"`
3. Your site fetches updated data and merges with existing
4. Website shows updated property details instantly

### When a property is set as inactive in iList:

1. Property status changed in iList CRM (`StatusID: 2`)
2. iList sends webhook with `event: "property.status_changed"`
3. Your site updates `status_id` to `2`
4. Property is hidden from public listings (RLS policy)
5. Property remains in dashboard for management

## Monitoring and Debugging

### Sync Sessions Table

Track all sync operations:

```sql
SELECT * FROM ilist_sync_sessions
ORDER BY started_at DESC
LIMIT 10;
```

### Failed Syncs

```sql
SELECT * FROM ilist_sync_sessions
WHERE status = 'failed'
ORDER BY started_at DESC;
```

### Property Sync Status

```sql
SELECT
  ilist_id,
  status_id,
  last_ilist_sync,
  update_date
FROM properties
WHERE last_ilist_sync < NOW() - INTERVAL '1 hour';
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: iList API has 10 requests per minute limit
   - Solution: Built-in rate limiting in `IListApiClient`

2. **Missing Properties**: Some properties don't sync
   - Check sync session logs
   - Verify property `StatusID` in iList
   - Check `IncludeDeletedFromCrm` parameter

3. **Webhook Not Working**: Real-time updates not appearing
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Test webhook endpoint manually

4. **Search Not Working**: Properties not found in search
   - Refresh materialized view: `REFRESH MATERIALIZED VIEW property_search_optimized;`
   - Check search vector generation

### Support

For iList API documentation and support:

- API Docs: Available in `ilist/ilist api.groovy`
- Base URL: `https://ilist.e-agents.gr`
- Rate Limit: 10 requests per minute
- Authentication: Bearer token in `authorization` header

## Complete Integration Checklist

- ✅ Database schema with 100% iList parity
- ✅ API client with rate limiting
- ✅ Sync service with error handling
- ✅ Webhook system for real-time updates
- ✅ Dashboard for property management
- ✅ Public property listing pages
- ✅ Property detail pages with full iList data
- ✅ Property inquiry system
- ✅ Status management (active/inactive sync)
- ✅ Search with Greek language support
- ✅ Image handling and display
- ✅ Agent contact information
- ✅ Sync monitoring and logging
