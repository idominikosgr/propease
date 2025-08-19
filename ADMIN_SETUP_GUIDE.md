# Admin Setup Guide

## Overview

Your real estate platform uses **Clerk + Supabase** with role-based access control. Here's how to set up admins and manage the system.

## Environment Variables Required

Add to your `.env.local`:

```bash
# Supabase SSR (Required for server-side operations)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Admin Setup (for first-time setup only)
ADMIN_SETUP_SECRET=Pritis123!

# iList Integration
ILIST_WEBHOOK_SECRET=webhook-secret-key
```

## User Roles System

### 🔴 **Admin** (Full Access)

- ✅ User management (`/dashboard/admin`)
- ✅ iList sync configuration
- ✅ All property data (including inactive)
- ✅ System settings and analytics
- ✅ Supabase service role access

### 🟡 **Agent** (Property Management)

- ✅ Property dashboard (`/dashboard/properties`)
- ✅ Property inquiries (`/dashboard/inquiries`)
- ✅ iList sync operations
- ✅ Property status management
- ❌ User management

### 🟢 **User** (Public Access)

- ✅ Browse properties (`/properties`)
- ✅ View property details (`/properties/[id]`)
- ✅ Submit inquiries
- ❌ Dashboard access

## How to Create Your First Admin

### Step 1: Sign Up

1. Go to your site and sign up with your email
2. Complete Clerk registration process

### Step 2: Assign Admin Role (One-time Setup)

**Option A: Using the API (Recommended)**

```bash
curl -X POST http://localhost:3000/api/admin/create-first-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: super-secret-admin-key-123" \
  -d '{"email": "your@email.com"}'
```

**Option B: Using Clerk Dashboard**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your app → Users
3. Find your user and edit
4. Add to Public Metadata:
   ```json
   {
     "role": "admin"
   }
   ```

### Step 3: Verify Admin Access

1. Refresh your browser
2. Go to `/dashboard` - you should see the admin panel link
3. Navigate to `/dashboard/admin` to manage users

## Admin Functions

### 1. **User Management** (`/dashboard/admin`)

- View all registered users
- Assign roles (admin/agent/user)
- Track user registration dates
- Role-based permission overview

### 2. **iList Integration** (`/dashboard/properties`)

- Configure iList API token
- Manual sync operations
- Monitor sync status and logs
- View all properties (active + inactive)

### 3. **System Monitoring**

- Sync session logs in Supabase
- Property inquiry tracking
- Error monitoring and debugging

## Clerk + Supabase Integration

### How It Works

```typescript
// 1. Clerk handles authentication
const { userId, has } = await auth();

// 2. Check role-based permissions
if (has({ role: "admin" })) {
  // Admin access - use service role key
  const supabase = createSupabaseServiceClient();
  // Bypass RLS, access all data
}

// 3. Public users see filtered data automatically
const supabase = await createSupabaseServerClient();
// RLS automatically shows only active properties
```

### Database Security (Row Level Security)

```sql
-- Public users: Only active properties
CREATE POLICY "Public read active properties" ON properties
  FOR SELECT USING (status_id = 1);

-- Authenticated users: All properties
CREATE POLICY "Authenticated users read all" ON properties
  FOR SELECT USING (auth.jwt() ->> 'sub' IS NOT NULL);
```

### API Route Protection

```typescript
// Protected admin routes
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { has } = await auth();

  if (!has({ role: "admin" })) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  // Admin-only operations
}
```

## Admin Workflow

### Daily Operations

1. **Monitor iList Sync**: Check `/dashboard/properties` for sync status
2. **Review Inquiries**: Respond to property inquiries
3. **Manage Properties**: Activate/deactivate listings as needed

### User Management

1. **Add Agents**: Assign `agent` role to real estate staff
2. **Monitor Users**: Track user registrations and activity
3. **Role Updates**: Promote/demote user permissions as needed

### System Maintenance

1. **Sync Monitoring**: Review sync logs in Supabase
2. **Database Health**: Monitor property counts and updates
3. **Error Tracking**: Check failed sync sessions

## Supabase Admin Access

### Direct Database Access

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. **SQL Editor**: Run custom queries
3. **Table Editor**: View/edit data directly

### Key Tables to Monitor

```sql
-- Recent sync sessions
SELECT * FROM ilist_sync_sessions ORDER BY started_at DESC LIMIT 10;

-- Property counts by status
SELECT status_id, COUNT(*) FROM properties GROUP BY status_id;

-- Recent inquiries
SELECT * FROM property_inquiries ORDER BY created_at DESC LIMIT 20;

-- Failed syncs
SELECT * FROM ilist_sync_sessions WHERE status = 'failed';
```

## Security Best Practices

### 1. **Environment Variables**

- Never commit `.env.local` to git
- Use different secrets for production
- Rotate webhook secrets regularly

### 2. **Role Assignment**

- Only assign admin role to trusted users
- Use agent role for staff members
- Regularly audit user roles

### 3. **API Security**

- Admin setup endpoint disabled after first use
- Webhook endpoints secured with secrets
- Rate limiting on public APIs

## Troubleshooting

### Can't Access Admin Panel?

1. Check your role in Clerk Dashboard
2. Ensure `role: "admin"` in publicMetadata
3. Refresh browser to update session

### Sync Issues?

1. Verify iList API token in dashboard
2. Check sync logs: `SELECT * FROM ilist_sync_sessions`
3. Test connection: `/api/ilist/test-connection`

### Database Issues?

1. Check Supabase project status
2. Verify RLS policies are active
3. Confirm environment variables

## Quick Start Checklist

- [ ] 1. Set up environment variables
- [ ] 2. Run Supabase schema migration
- [ ] 3. Sign up for account on your site
- [ ] 4. Create first admin using API endpoint
- [ ] 5. Configure iList API token in dashboard
- [ ] 6. Run initial property sync
- [ ] 7. Test public property listings
- [ ] 8. Set up webhook in iList (optional)

You now have complete admin control over your real estate platform! 🏡
