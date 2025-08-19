# Architecture Guide: Clerk + Supabase + iList Integration

## Recommended Architecture

This setup provides the best of both worlds:

### 🔐 Clerk (Authentication)

- User sign-up/sign-in
- Role-based access control
- Social logins (Google, Facebook)
- User profile management
- Dashboard access protection

### 🗄️ Supabase (Data & Real-time)

- Property database with iList parity
- Real-time property updates
- PostGIS for location queries
- Full-text search in Greek
- Property inquiries/leads
- File storage for additional assets

### 🏢 iList CRM (Source of Truth)

- Property content management
- Agent/partner information
- Property status control
- Image management
- Property characteristics

## Benefits of This Architecture

### 1. **Best-in-Class Authentication**

```typescript
// Clerk handles all authentication complexity
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  // Automatic redirect if not authenticated
}
```

### 2. **Powerful Property Data Management**

```sql
-- Supabase with PostGIS for advanced queries
SELECT * FROM properties
WHERE ST_DWithin(location, ST_Point(23.7275, 37.9838), 1000)
AND price BETWEEN 100000 AND 500000;
```

### 3. **Real-time Updates**

```typescript
// Live property updates when iList changes
const subscription = supabase.channel("properties").on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "properties",
  },
  (payload) => {
    // Update UI instantly when iList syncs
  },
);
```

## Implementation Strategy

### Phase 1: Core Setup ✅

- [x] Supabase schema with 100% iList parity
- [x] API routes for iList integration
- [x] Public property listings
- [x] Property detail pages
- [x] Basic dashboard

### Phase 2: Enhanced Integration

```typescript
// Add Clerk user context to Supabase
await supabase.from("user_preferences").upsert({
  clerk_user_id: userId,
  favorite_properties: [],
  search_alerts: [],
  preferred_areas: [],
});
```

### Phase 3: Advanced Features

- Real-time notifications for agents
- Property viewing analytics
- Lead scoring and assignment
- Automated email campaigns
- Advanced search filters

## User Roles & Permissions

### Public Users (No Auth Required)

- Browse properties (`/properties`)
- View property details (`/properties/[id]`)
- Submit inquiries
- **Supabase RLS**: Only see active properties (`status_id = 1`)

### Authenticated Agents (Clerk + Supabase)

- Access dashboard (`/dashboard`)
- Manage properties
- View/respond to inquiries
- Sync with iList
- **Clerk roles**: `agent`, `admin`

### Admin Users (Clerk + Supabase)

- Full dashboard access
- iList sync configuration
- User management
- Analytics and reporting
- **Clerk roles**: `admin`

## Data Flow Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   iList     │    │  Your Site   │    │   Public    │
│     CRM     │    │              │    │   Users     │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Webhook        │                   │
       ├──────────────────▶│                   │
       │                   │                   │
       │ 2. API Sync       │                   │
       ├──────────────────▶│                   │
       │                   │ 3. Live Updates   │
       │                   ├──────────────────▶│
       │                   │                   │
       │                   │ 4. Inquiries      │
       │                   │◀──────────────────┤
       │ 5. Lead Sync      │                   │
       │◀──────────────────┤                   │
```

## Environment Variables Setup

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# iList Integration
ILIST_WEBHOOK_SECRET=secure-webhook-secret
CRON_SECRET=secure-cron-secret

# App Configuration
NEXTAUTH_URL=https://yoursite.com
```

## Database Integration Pattern

### Supabase Tables with Clerk User References

```sql
-- Extend user preferences with Clerk ID
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR NOT NULL UNIQUE,
  favorite_properties UUID[] DEFAULT '{}',
  search_alerts JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property inquiries linked to Clerk users (optional)
ALTER TABLE property_inquiries
ADD COLUMN clerk_user_id VARCHAR;

-- Property viewing history
CREATE TABLE property_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  clerk_user_id VARCHAR, -- Optional: only for logged-in users
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Route Examples

### Protected Dashboard Routes

```typescript
// src/app/api/dashboard/properties/route.ts
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access full property data including inactive properties
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // ... fetch all properties for dashboard
}
```

### Public Property Routes (No Auth)

```typescript
// src/app/api/properties/route.ts
export async function GET() {
  // Use anon key - RLS automatically filters to active properties only
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  // ... fetch active properties for public site
}
```

## Frontend Integration

### Dashboard (Protected by Clerk)

```typescript
// src/app/dashboard/properties/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  // Dashboard only accessible to authenticated users

  return (
    <div>
      {/* Property management interface */}
      {/* iList sync controls */}
      {/* Full property data access */}
    </div>
  );
}
```

### Public Site (No Auth Required)

```typescript
// src/app/properties/page.tsx
export default function PropertiesPage() {
  // Public access - no authentication needed
  // Supabase RLS automatically shows only active properties

  return (
    <div>
      {/* Public property listings */}
      {/* Search and filters */}
      {/* Contact forms */}
    </div>
  );
}
```

## Real-time Integration

### Property Updates (Supabase Realtime)

```typescript
// Real-time property updates when iList syncs
useEffect(() => {
  const subscription = supabase
    .channel("properties")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "properties",
        filter: "status_id=eq.1", // Only active properties
      },
      (payload) => {
        // Update property list in real-time
        setProperties((prev) => {
          // Handle insert/update/delete
        });
      },
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### User Preferences (Clerk + Supabase)

```typescript
// Save user preferences with Clerk ID
const { userId } = useAuth();

const savePreferences = async (preferences: any) => {
  await supabase.from("user_preferences").upsert({
    clerk_user_id: userId,
    ...preferences,
  });
};
```

## Security Model

### Row Level Security (Supabase)

```sql
-- Public can only see active properties
CREATE POLICY "Public read active properties" ON properties
  FOR SELECT USING (status_id = 1);

-- Authenticated users can see all properties
CREATE POLICY "Authenticated users read all properties" ON properties
  FOR SELECT USING (auth.jwt() ->> 'sub' IS NOT NULL);
```

### API Route Protection (Clerk)

```typescript
// Protected dashboard APIs
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role-based permissions
  if (!has({ role: "agent" }) && !has({ role: "admin" })) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // Access granted
}
```

## Recommended Setup Order

1. **Keep Clerk** (already working) ✅
2. **Add Supabase** for property data ✅
3. **Configure RLS** for public access ✅
4. **Set up iList sync** ✅
5. **Add real-time subscriptions**
6. **Extend with user preferences**

This gives you:

- ✅ Robust authentication (Clerk)
- ✅ Powerful property database (Supabase)
- ✅ Real-time updates
- ✅ Perfect iList integration
- ✅ Scalable architecture

The split leverages each service's strengths while maintaining simplicity!
