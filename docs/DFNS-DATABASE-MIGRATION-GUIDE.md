# DFNS Database Migration Instructions

## 📋 **Apply DFNS Tables to Supabase**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `/supabase/migrations/20250605000001_create_dfns_tables.sql`
4. Paste into SQL Editor and run
5. Verify all 25+ tables are created successfully

### **Option 2: Supabase CLI**
```bash
cd /Users/neilbatchelor/Cursor/Chain Capital Production
supabase db push
```

### **Option 3: psql Command Line**
```bash
psql "postgresql://postgres.jrwfkxfzsnnjppogthaw:oqAY2u75AuGhVD3T@aws-0-eu-west-2.pooler.supabase.com:5432/postgres" -f supabase/migrations/20250605000001_create_dfns_tables.sql
```

## 🔍 **Verification Steps**

After applying the migration, verify the tables exist:

```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE 'dfns_%'
ORDER BY tablename;
```

Expected result: 25+ DFNS tables including:
- dfns_applications
- dfns_users  
- dfns_wallets
- dfns_signing_keys
- dfns_transfers
- dfns_policies
- dfns_webhooks
- And 18+ more tables

## 🚨 **Important Notes**
- Migration includes Row Level Security (RLS) policies
- All tables have proper indexes for performance
- Foreign key relationships are properly established
- Updated_at triggers are configured for all tables

## ✅ **Next Steps After Migration**
1. Confirm all tables created successfully
2. Test basic CRUD operations
3. Proceed with DFNS UI component development
4. Set up DFNS account and API credentials

---
**File**: `/supabase/migrations/20250605000001_create_dfns_tables.sql`
**Tables Created**: 25+ comprehensive DFNS integration tables
**Date**: June 5, 2025
