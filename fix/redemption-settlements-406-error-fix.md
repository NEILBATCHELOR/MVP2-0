# Fix for 406 Redemption Settlements Error

## Problem
Getting `406 Not Acceptable` error when querying `redemption_settlements` table because Row Level Security (RLS) requires authenticated users.

## Root Cause
- ✅ Database table exists with correct schema
- ✅ Migration has been deployed successfully  
- ❌ RLS policy requires `auth.role() = 'authenticated'`
- ❌ Supabase client using anonymous key without user authentication

## Quick Solutions

### Solution 1: Disable RLS for Development (Fastest)
Run this SQL in your Supabase SQL Editor:

```sql
-- Temporarily allow anonymous access for development
DROP POLICY IF EXISTS "Users can view settlements" ON redemption_settlements;

CREATE POLICY "Allow anonymous access for development"
ON redemption_settlements FOR SELECT
USING (true);
```

**Pros:** Immediate fix, works right away
**Cons:** Not secure for production

### Solution 2: Use Updated Settlement Service (Recommended)
The settlement service has been updated with authentication wrappers:

1. **Files Updated:**
   - `/src/components/redemption/services/authUtils.ts` - Authentication utilities
   - `/src/components/redemption/services/settlementService.ts` - Updated with auth

2. **How it works:**
   - Automatically creates anonymous session for development
   - Wraps database calls with authentication check
   - Graceful fallback for unauthenticated requests

3. **Test the fix:**
   ```bash
   npm run dev
   # Navigate to redemption dashboard
   # Should work without 406 errors
   ```

### Solution 3: Environment Variables (Production)
Add service role key to your `.env` file:

```env
VITE_SUPABASE_URL=https://jrwfkxfzsnnjppogthaw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then use the admin service:
```typescript
import { adminSettlementService } from '@/components/redemption/services/adminSettlementService';

// Use for administrative operations
const settlements = await adminSettlementService.listSettlements();
```

### Solution 4: Implement User Authentication
For production apps, implement proper user authentication:

```typescript
// Sign in user before accessing redemption data
await supabase.auth.signInWithEmail({
  email: 'user@example.com',
  password: 'password'
});

// Now settlement queries will work
const settlement = await settlementService.getSettlementStatus(id);
```

## Verification
After applying any solution, test by navigating to the redemption dashboard. The 406 errors should be resolved.

## Files Modified
- `/src/components/redemption/services/authUtils.ts` - Created
- `/src/components/redemption/services/settlementService.ts` - Updated
- `/src/components/redemption/services/adminSettlementService.ts` - Created

## Next Steps
1. Choose and implement one of the solutions above
2. Test the redemption dashboard functionality  
3. For production: implement proper user authentication
4. Consider updating other redemption services with similar auth patterns
