# Redemption Calendar Module

## Overview

The Redemption Calendar module provides comprehensive functionality for managing interval fund redemption windows, including calendar visualization, window configuration, and Net Asset Value (NAV) management. This module is specifically designed for tokenized interval funds that require periodic redemption opportunities rather than continuous liquidity.

## Components

### 1. RedemptionCalendar

A visual calendar component that displays redemption windows and allows investors to view and interact with scheduled redemption periods.

**Features:**
- Interactive calendar view with redemption window indicators
- Color-coded status visualization (upcoming, open, closed, processing, completed)
- Detailed window information sidebar
- Direct redemption request submission
- Quick navigation to future periods

**Usage:**
```tsx
import { RedemptionCalendar, generateSampleWindows } from '@/components/redemption/calendar';

const windows = generateSampleWindows();

<RedemptionCalendar
  windows={windows}
  selectedDate={new Date()}
  onDateSelect={(date) => console.log('Selected:', date)}
  onWindowSelect={(window) => console.log('Window:', window)}
  onCreateRedemption={(windowId) => handleRedemption(windowId)}
  showActions={true}
/>
```

### 2. RedemptionWindows

Administrative interface for configuring and managing redemption window configurations and instances.

**Features:**
- Window configuration management (frequency, submission periods, lock-up periods)
- Instance tracking and status monitoring
- Pro-rata distribution settings
- Queue management for oversubscribed windows
- Admin override capabilities
- Bulk import/export functionality

**Usage:**
```tsx
import { RedemptionWindows } from '@/components/redemption/calendar';

<RedemptionWindows
  configs={windowConfigs}
  instances={windowInstances}
  onConfigCreate={(config) => handleConfigCreate(config)}
  onConfigUpdate={(id, config) => handleConfigUpdate(id, config)}
  onInstanceProcess={(id) => handleInstanceProcess(id)}
/>
```

### 3. NAVManagement

Comprehensive Net Asset Value management for interval funds, including manual entry, oracle integration, and historical tracking.

**Features:**
- Current NAV display with trend indicators
- Historical NAV tracking and visualization
- Manual NAV calculation and entry
- Oracle price feed integration
- Validation workflow for NAV entries
- Volatility and performance metrics

**Usage:**
```tsx
import { NAVManagement } from '@/components/redemption/calendar';

<NAVManagement
  fundId="fund-123"
  navHistory={navHistory}
  oracleConfigs={oracleConfigs}
  onNAVCreate={(data) => handleNAVCreate(data)}
  onNAVValidate={(id) => handleNAVValidate(id)}
  onOracleRefresh={(id) => handleOracleRefresh(id)}
/>
```

## Data Structures

### RedemptionWindow
```typescript
interface RedemptionWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  submissionStartDate: Date;
  submissionEndDate: Date;
  frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  nav?: number;
  status: 'upcoming' | 'submission_open' | 'submission_closed' | 'processing' | 'completed';
  maxRedemptionAmount?: number;
  currentRequests?: number;
  totalRequestValue?: number;
  lockUpPeriod?: number;
}
```

### RedemptionWindowConfig
```typescript
interface RedemptionWindowConfig {
  id: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  submissionWindowDays: number;
  lockUpPeriod: number;
  maxRedemptionPercentage?: number;
  enableProRataDistribution: boolean;
  queueUnprocessedRequests: boolean;
  useWindowNAV: boolean;
  lockTokensOnRequest: boolean;
  enableAdminOverride: boolean;
  notificationDays: number;
  active: boolean;
}
```

### NAVData
```typescript
interface NAVData {
  id: string;
  fundId: string;
  date: Date;
  nav: number;
  totalAssets: number;
  totalLiabilities: number;
  outstandingShares: number;
  previousNAV?: number;
  change?: number;
  changePercent?: number;
  source: 'manual' | 'oracle' | 'calculated' | 'administrator';
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  notes?: string;
}
```

## Integration with Database

The calendar module integrates with the existing database schema through the `redemption_rules` table:

**Key Database Fields:**
- `repurchase_frequency`: Window frequency (monthly, quarterly, etc.)
- `submission_window_days`: Days for request submission
- `lock_up_period`: Token lock-up period in days
- `use_window_nav`: Whether to use window-specific NAV
- `enable_pro_rata_distribution`: Pro-rata allocation when oversubscribed
- `queue_unprocessed_requests`: Queue excess requests for next window

## Workflow Integration

### Standard Redemption Flow
1. **Window Scheduling**: Configure redemption windows based on fund requirements
2. **Submission Period**: Investors submit requests during open submission windows
3. **NAV Calculation**: Calculate or fetch NAV for the redemption window
4. **Processing**: Execute redemptions based on available liquidity and pro-rata rules
5. **Settlement**: Complete token burning and fund transfers

### Interval Fund Specific Features
- **Periodic Liquidity**: Limited redemption opportunities (monthly, quarterly, etc.)
- **Submission Windows**: Specific periods for request submission
- **Lock-up Periods**: Minimum holding requirements before redemption eligibility
- **Pro-rata Distribution**: Fair allocation when requests exceed available liquidity
- **Queue Management**: Handle excess requests for future windows

## Configuration Examples

### Quarterly Interval Fund
```typescript
const quarterlyConfig: RedemptionWindowConfig = {
  name: "Quarterly Redemption",
  frequency: "quarterly",
  submissionWindowDays: 14,        // 2-week submission window
  lockUpPeriod: 90,                // 90-day lock-up
  maxRedemptionPercentage: 25,     // Max 25% of fund per quarter
  enableProRataDistribution: true,
  queueUnprocessedRequests: true,
  useWindowNAV: true,              // Use NAV at window close
  lockTokensOnRequest: true,       // Lock tokens when requested
  enableAdminOverride: false,
  notificationDays: 7,             // 7-day advance notice
  active: true
};
```

### Monthly High-Frequency Fund
```typescript
const monthlyConfig: RedemptionWindowConfig = {
  name: "Monthly Redemption",
  frequency: "monthly",
  submissionWindowDays: 7,         // 1-week submission window
  lockUpPeriod: 30,                // 30-day lock-up
  maxRedemptionPercentage: 10,     // Max 10% of fund per month
  enableProRataDistribution: true,
  queueUnprocessedRequests: false, // Reject excess requests
  useWindowNAV: true,
  lockTokensOnRequest: false,      // Allow trading during submission
  enableAdminOverride: true,       // Allow admin flexibility
  notificationDays: 3,             // 3-day advance notice
  active: true
};
```

## Status Management

### Window Status Lifecycle
1. **Scheduled**: Window is configured but submission not yet open
2. **Submission Open**: Investors can submit redemption requests
3. **Submission Closed**: No new requests accepted, processing preparation
4. **Processing**: Redemptions being executed and settled
5. **Completed**: All redemptions processed and settled
6. **Cancelled**: Window cancelled (admin action)

### NAV Validation Workflow
1. **Entry**: Manual entry or oracle-based NAV data
2. **Calculation**: Automatic calculation from asset/liability data
3. **Validation**: Administrative review and approval
4. **Publication**: NAV becomes available for redemption calculations

## Error Handling

The calendar module includes comprehensive error handling for:
- Invalid date ranges or configuration parameters
- Oracle connectivity issues and data validation
- Insufficient liquidity for redemption requests
- Database synchronization problems
- Real-time update failures

## Performance Considerations

- **Calendar Rendering**: Optimized for monthly views with efficient date calculations
- **Data Fetching**: Lazy loading for historical NAV data and window instances
- **Real-time Updates**: WebSocket integration for live status updates
- **Caching**: Intelligent caching of NAV data and window configurations

## Security Features

- **Role-based Access**: Different views for investors vs. administrators
- **Data Validation**: Comprehensive input validation for all forms
- **Audit Logging**: Full audit trail for NAV entries and window modifications
- **Oracle Security**: Secure API key management for external data feeds

## Future Enhancements

1. **Multi-Fund Support**: Calendar views for multiple interval funds
2. **Advanced Analytics**: Predictive modeling for redemption patterns
3. **Mobile App Integration**: Native mobile calendar components
4. **Regulatory Reporting**: Automated compliance report generation
5. **Smart Contract Integration**: Blockchain-based window execution

## Dependencies

- **UI Components**: Shadcn/ui component library
- **Charts**: Recharts for NAV trend visualization
- **Date Handling**: date-fns for date calculations and formatting
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS for responsive design

## Testing

The calendar module includes comprehensive test coverage for:
- Window calculation algorithms
- NAV calculation accuracy
- Calendar date handling edge cases
- User interaction flows
- Data persistence and synchronization

## Support

For issues, questions, or feature requests related to the Redemption Calendar module, please refer to the main redemption module documentation or contact the development team.
