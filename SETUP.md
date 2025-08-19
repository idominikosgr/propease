# RealtyIQ Setup Guide

## Environment Configuration

The application requires several environment variables to be configured. Follow these steps:

### 1. Create Environment File

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

#### Supabase Configuration (Required)
You need to set up a Supabase project and obtain these values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings > API
4. Copy the values:
   - URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

#### Clerk Authentication (Required)
You need to set up Clerk for authentication:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**How to get these values:**
1. Go to [Clerk Dashboard](https://clerk.com)
2. Create a new application or select existing one
3. Go to API Keys section
4. Copy the values:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`

### 3. Database Setup

The application uses Supabase with specific database schema. Run the migrations:

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually run the SQL files in supabase/migrations/ in your Supabase SQL editor
```

### 4. Verification

After setting up the environment variables, restart your development server:

```bash
pnpm dev
```

If you still see database connection errors, check:
1. Environment variables are properly set in `.env.local`
2. Supabase project is active and accessible
3. Database schema is properly migrated
4. Clerk application is configured

## Common Issues

### "TypeError: fetch failed" Errors

This usually indicates missing environment variables. Check:
- `.env.local` file exists in the project root
- All required variables are set with valid values
- No extra spaces or quotes around values
- Development server was restarted after changing env vars

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is not paused
- Ensure database migrations have been applied

### Authentication Issues

- Verify Clerk keys are correct and from the same project
- Check Clerk application settings match your domain
- Ensure Clerk integration with Supabase is configured if using RLS