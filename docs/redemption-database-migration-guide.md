# Redemption Database Migration Deployment Guide

## Overview

This guide provides instructions for deploying the redemption system database schema to Supabase. The migration creates 6 new tables and associated indexes, policies, and functions required for the complete redemption system.

## Prerequisites

- Supabase project with existing redemption tables
- Database admin access
- Backup of existing data (recommended)

## Migration Script Location

```
/scripts/redemption-database-migration.sql
```

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Navigate to your project
   - Go to Database → SQL Editor

2. **Run Migration Script**
   - Open a new SQL query
   - Copy the contents of `redemption-database-migration.sql`
   - Execute the script

3. **Verify Deployment**
   - Check Database → Tables for new tables:
     - `redemption_settlements`
     - `settlement_metrics`
     - `fund_nav_data`
     - `nav_oracle_configs`
     - `redemption_window_configs`
     - `redemption_windows`

### Method 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

### Method 3: Direct SQL Connection

```bash
# Using psql (replace with your connection string)
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f scripts/redemption-database-migration.sql
```

## New Tables Created

### 1. redemption_settlements
**Purpose**: Tracks settlement processing for redemption requests
- Settlement workflow status tracking
- Token burning transaction details
- Fund transfer execution details
- Gas usage and fee tracking
- Error handling and retry logic

### 2. settlement_metrics
**Purpose**: Daily aggregated settlement performance metrics
- Success/failure rates
- Processing time analytics
- Volume and fee tracking
- Performance monitoring

### 3. fund_nav_data
**Purpose**: Historical Net Asset Value tracking
- Daily NAV records with validation workflow
- Asset/liability breakdown
- Change calculations
- Multi-source data support (manual, oracle, calculated)

### 4. nav_oracle_configs
**Purpose**: Oracle configuration for automated NAV feeds
- Oracle endpoint management
- Update frequency configuration
- Validation rules and limits
- Success rate monitoring

### 5. redemption_window_configs
**Purpose**: Configuration templates for interval fund windows
- Window frequency and timing rules
- Pro-rata distribution settings
- Redemption limits and controls
- Administrative overrides

### 6. redemption_windows
**Purpose**: Specific redemption window instances
- Window lifecycle tracking
- Request aggregation and processing
- NAV integration for window pricing
- Approval/rejection statistics

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Admin-only access for configuration tables
- User read access for data tables
- Proper authentication checks

### Sample Policies Created
- `Users can view settlements` - Read access for authenticated users
- `Admins can insert settlements` - Write access for admins
- `Admins can manage NAV data` - Full access for admins
- `Users can view redemption windows` - Read access for users

## Performance Optimizations

### Indexes Created
- Settlement request lookups
- Status-based queries
- Date-range queries
- Fund-specific data retrieval

### Views Created
- `settlement_summary` - Comprehensive settlement overview
- `latest_nav_by_fund` - Most recent NAV per fund
- `active_redemption_windows` - Current window status

## Functions and Triggers

### Automatic Status Updates
- `update_settlement_status()` - Auto-completes settlements
- `calculate_nav_change()` - Computes NAV change percentages

### Business Logic Enforcement
- Settlement completion detection
- NAV historical comparisons
- Data consistency maintenance

## Sample Data

The migration includes sample data for testing:
- 3 NAV records for fund testing
- 2 redemption window configurations
- Proper data relationships

## Verification Steps

After running the migration:

1. **Table Verification**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%redemption%' 
   OR table_name LIKE '%settlement%' 
   OR table_name LIKE '%nav%';
   ```

2. **Policy Verification**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('redemption_settlements', 'fund_nav_data', 'redemption_windows');
   ```

3. **Sample Data Verification**
   ```sql
   SELECT COUNT(*) FROM fund_nav_data;
   SELECT COUNT(*) FROM redemption_window_configs;
   ```

## Post-Migration Tasks

### 1. Update Type Definitions
After migration, update TypeScript types:
```bash
# Generate new Supabase types
npx supabase gen types typescript --project-ref YOUR_PROJECT_REF > src/types/core/supabase.ts
```

### 2. Service Integration
- Update redemption services to use real database operations
- Replace mock data with actual database queries
- Test settlement workflow end-to-end

### 3. Real-time Subscriptions
- Configure Supabase real-time for new tables
- Update hooks to subscribe to settlement status changes
- Test real-time updates in dashboard

## Rollback Plan

If issues occur:

1. **Drop New Tables**
   ```sql
   DROP TABLE IF EXISTS redemption_settlements CASCADE;
   DROP TABLE IF EXISTS settlement_metrics CASCADE;
   DROP TABLE IF EXISTS fund_nav_data CASCADE;
   DROP TABLE IF EXISTS nav_oracle_configs CASCADE;
   DROP TABLE IF EXISTS redemption_window_configs CASCADE;
   DROP TABLE IF EXISTS redemption_windows CASCADE;
   ```

2. **Remove Functions**
   ```sql
   DROP FUNCTION IF EXISTS update_settlement_status();
   DROP FUNCTION IF EXISTS calculate_nav_change();
   ```

3. **Remove Views**
   ```sql
   DROP VIEW IF EXISTS settlement_summary;
   DROP VIEW IF EXISTS latest_nav_by_fund;
   DROP VIEW IF EXISTS active_redemption_windows;
   ```

## Environment Variables

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Success Criteria

Migration is successful when:
- ✅ All 6 tables created without errors
- ✅ Sample data inserted successfully
- ✅ RLS policies active and functioning
- ✅ Indexes created for performance
- ✅ Functions and triggers operational
- ✅ Views accessible and returning data

## Next Steps After Migration

1. **Update Services**: Replace mock data with real database operations
2. **Test Settlement Workflow**: End-to-end settlement processing
3. **Configure Real-time**: Set up live dashboard updates
4. **Performance Testing**: Validate query performance
5. **Security Review**: Verify RLS policies and access controls

## Support

For issues with the migration:
1. Check Supabase logs for detailed error messages
2. Verify database permissions and authentication
3. Ensure all prerequisite tables exist
4. Contact development team with specific error details

---

**Migration File**: `/scripts/redemption-database-migration.sql`  
**Documentation**: This deployment guide  
**Status**: Ready for deployment  
**Next Phase**: Service integration and testing
