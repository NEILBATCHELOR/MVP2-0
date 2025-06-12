# Guardian API Test Center - Redesigned

## Overview

The Guardian API Test Center has been completely redesigned to provide a comprehensive testing and monitoring solution for Guardian Medex API operations. This system provides clear separation between data sent to Guardian vs data received from Guardian, with proper database tracking and comparison capabilities.

## ✅ Completed Features

### 1. **Dedicated Database Tables**
- `guardian_api_tests` - Records all API requests and responses
- `guardian_wallets` - Tracks Guardian wallets through their lifecycle  
- `guardian_operations` - Monitors Guardian operations and status changes
- Proper relationships and indexes for performance

### 2. **TypeScript Type System**
- Complete type definitions in `src/types/guardian/guardianTesting.ts`
- Insert, update, and response types for all database operations
- Strict typing for Guardian API interactions

### 3. **Database Service Layer**
- `GuardianTestDatabaseService` handles all database operations
- Proper error handling and transaction management
- Statistics and analytics functions
- Database write capability detection

### 4. **Redesigned UI**
- **Dashboard Tab**: Overview with statistics and quick actions
- **Live Testing Tab**: Real-time API testing with request/response views
- **Test History Tab**: Historical test data with filtering
- **Guardian Wallets Tab**: Wallet lifecycle tracking
- **Data Comparison Tab**: Visual comparison of sent vs received data

### 5. **Enhanced Features**
- ✅ Real-time test execution tracking
- ✅ Visual request/response flow
- ✅ Complete Guardian wallet lifecycle monitoring
- ✅ Data flow visualization 
- ✅ Statistics and analytics dashboard
- ✅ Database write status monitoring
- ✅ Error tracking and reporting

## 🗄️ Database Schema

### Guardian API Tests Table
```sql
CREATE TABLE guardian_api_tests (
  id UUID PRIMARY KEY,
  test_name VARCHAR(100) NOT NULL,
  test_type VARCHAR(50) NOT NULL,
  endpoint VARCHAR(200) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  guardian_wallet_id VARCHAR(100),
  guardian_operation_id VARCHAR(100),
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Guardian Wallets Table
```sql
CREATE TABLE guardian_wallets (
  id UUID PRIMARY KEY,
  guardian_wallet_id VARCHAR(100) UNIQUE NOT NULL,
  guardian_operation_id VARCHAR(100),
  wallet_name VARCHAR(200),
  wallet_status VARCHAR(50),
  wallet_addresses JSONB,
  requested_at TIMESTAMP DEFAULT NOW(),
  operation_completed_at TIMESTAMP,
  wallet_retrieved_at TIMESTAMP
);
```

### Guardian Operations Table
```sql
CREATE TABLE guardian_operations (
  id UUID PRIMARY KEY,
  operation_id VARCHAR(100) UNIQUE NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  operation_status VARCHAR(50),
  guardian_wallet_id VARCHAR(100),
  operation_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_checked_at TIMESTAMP DEFAULT NOW(),
  check_count INTEGER DEFAULT 0
);
```

## 📁 File Structure

```
src/
├── types/guardian/
│   └── guardianTesting.ts           # Type definitions for test system
├── services/
│   └── GuardianTestDatabaseService.ts  # Database operations service
├── pages/wallet/
│   ├── GuardianTestPage.tsx         # Original test page (legacy)
│   └── GuardianTestPageRedesigned.tsx  # New redesigned test page
└── infrastructure/guardian/
    ├── GuardianApiClient.ts         # Guardian API client
    ├── GuardianAuth.ts              # Authentication handling
    └── GuardianWalletService.ts     # Wallet service integration
```

## 🔄 Data Flow

### 1. **Request Flow (What We Send)**
```
User Input → API Request → Guardian API
    ↓
Database Record (guardian_api_tests)
    ↓
Guardian Wallet Record (guardian_wallets)
    ↓
Guardian Operation Record (guardian_operations)
```

### 2. **Response Flow (What We Receive)**
```
Guardian API Response → Database Update
    ↓
Operation Status Tracking
    ↓
Wallet Details Retrieval
    ↓
Complete Flow Recording
```

### 3. **Comparison View**
- **Sent Data**: Shows UUIDs, request payloads, timestamps
- **Received Data**: Shows operation IDs, wallet addresses, status updates
- **Database Data**: Shows our internal tracking and metadata
- **Visual Diff**: Highlights discrepancies and completion status

## 🎯 Key Improvements Over Original

### Better Organization
- ✅ Separate database tables instead of generic `wallet_details`
- ✅ Clear separation of concerns (API tests vs wallet tracking vs operations)
- ✅ Proper relationships between related data

### Enhanced UI/UX
- ✅ Tabbed interface instead of cramped single view
- ✅ Real-time test execution with progress indicators
- ✅ Visual request/response comparison
- ✅ Statistics dashboard with key metrics
- ✅ Historical data browsing with filters

### Better Data Tracking
- ✅ Complete audit trail of all API interactions
- ✅ Timeline tracking from request to completion
- ✅ Error categorization and reporting
- ✅ Performance metrics and execution times

### Developer Experience
- ✅ Type-safe database operations
- ✅ Comprehensive error handling
- ✅ Easy to extend for new Guardian API endpoints
- ✅ Clean separation between UI and business logic

## 🚀 Getting Started

### 1. Database Setup
```sql
-- Run the SQL migration script
\i supabase_guardian_test_tables.sql
```

### 2. Update Your Route
```typescript
// In your routing configuration
import GuardianTestPageRedesigned from '@/pages/wallet/GuardianTestPageRedesigned';

// Replace the old GuardianTestPage route
<Route path="/guardian-test" element={<GuardianTestPageRedesigned />} />
```

### 3. Test the System
1. Navigate to the Guardian Test Center
2. Check the Dashboard for statistics
3. Run a Complete Flow Test
4. Monitor results in Live Testing tab
5. Review data in Guardian Wallets tab
6. Compare sent vs received data in Comparison tab

## 📊 Usage Examples

### Testing Individual API Endpoints
```typescript
// The page provides UI for these operations:
- POST /api/v1/wallets/create (with custom or generated UUID)
- GET /api/v1/wallets (list all wallets)
- GET /api/v1/wallets/{id} (get specific wallet)
- GET /api/v1/operations/{id} (check operation status)
- GET /api/v1/operations (list all operations)
```

### Complete Flow Testing
1. **Create Wallet**: Send UUID to Guardian → Get operation ID
2. **Check Operation**: Monitor operation status → Get completion status
3. **Retrieve Wallet**: Get wallet details → Get addresses and metadata
4. **Database Recording**: All steps automatically recorded with relationships

### Data Analysis
- View success/failure rates
- Monitor operation completion times
- Track wallet creation patterns
- Analyze API performance metrics
- Compare Guardian data with internal records

## 🔧 Configuration

### Environment Variables
```env
# Guardian API credentials (required)
GUARDIAN_API_KEY=your_api_key
GUARDIAN_PRIVATE_KEY=your_ed25519_private_key

# Database connection (handled by Supabase)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Permissions
The system requires read/write access to:
- `guardian_api_tests`
- `guardian_wallets`  
- `guardian_operations`

RLS policies are included in the migration script.

## 🎯 Next Steps

### ✅ Completed
- [x] Database schema design and migration
- [x] TypeScript type system
- [x] Database service layer
- [x] Redesigned UI with tabbed interface
- [x] Real-time test execution tracking
- [x] Data comparison and visualization
- [x] Statistics dashboard
- [x] Complete flow testing

### 🔄 Partially Completed
- [ ] Migration from old `wallet_details` table data
- [ ] Advanced filtering and search in history
- [ ] Export functionality for test data
- [ ] Webhook integration for real-time Guardian updates

### 📋 Remaining Tasks
1. **Data Migration**: Move existing test data from `wallet_details` to new tables
2. **Advanced Analytics**: More detailed reporting and trend analysis
3. **Alert System**: Notifications for failed operations or long-running tasks
4. **API Documentation Integration**: Link test results to Guardian API docs
5. **Automated Testing**: Scheduled tests and health checks

## 🎉 Benefits

### For Developers
- Clear separation of test data from production wallet data
- Type-safe database operations with full TypeScript support
- Easy to debug API issues with complete request/response logs
- Visual comparison tools for data validation

### For Testing
- Comprehensive audit trail of all Guardian API interactions
- Real-time monitoring of operation status
- Easy identification of failed operations and error patterns
- Performance metrics for API response times

### For Production Readiness
- Proper database design for scalability
- Error handling and recovery mechanisms
- Monitoring and alerting capabilities
- Data integrity validation tools

## 📞 Support

For questions or issues with the Guardian Test Center:

1. Check the test execution logs in the Live Testing tab
2. Review error messages in the Test History
3. Verify database connectivity in the Dashboard
4. Ensure Guardian API credentials are properly configured

The system is designed to be self-diagnosing with clear error messages and status indicators throughout the UI.
