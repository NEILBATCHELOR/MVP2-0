# Average Duration Update

## Change Summary
The metric previously labeled "Average Age" has been renamed to "Average Duration" and the calculation has been updated to reflect the average duration between invoice date and due date for invoices in a pool, rather than the age of invoices from creation date until now.

## Implementation Details

### What Was Changed
- Renamed "Avg. Age" to "Avg. Duration" in all UI components
- Updated the calculation to measure the time period between invoice date and due date
- Added validation to handle cases where invoice date or due date might be missing
- Ensured that only positive durations are counted

### Files Modified
1. `PoolManager.tsx`
2. `TokenizationManager.tsx`
3. `FactoringDashboard.tsx`

### Calculation Logic
The previous calculation determined age as the number of days from invoice date to the current date:
```typescript
const now = new Date();
const totalAge = poolInvoices.reduce((sum, invoice) => {
  const invoiceDate = new Date(invoice.invoiceDate);
  const ageInDays = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
  return sum + ageInDays;
}, 0);
```

The new calculation determines duration as the number of days between invoice date and due date:
```typescript
const totalDuration = poolInvoices.reduce((sum, invoice) => {
  if (!invoice.invoiceDate || !invoice.dueDate) return sum;
  
  const invoiceDate = new Date(invoice.invoiceDate);
  const dueDate = new Date(invoice.dueDate);
  
  // Skip invalid dates
  if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) return sum;
  
  const durationInDays = Math.floor((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
  return sum + (durationInDays > 0 ? durationInDays : 0); // Ensure non-negative
}, 0);
```

## Business Implication
This update provides a more accurate metric for factoring purposes:

1. **More Accurate Yield Calculation**: The duration between invoice date and due date represents the expected payment period, which is essential for calculating the annualized yield.

2. **Better Risk Assessment**: Understanding the average duration helps assess the risk and time value of money for the invoice pool.

3. **Improved Investor Information**: Investors can now see how long on average they'll need to wait for invoice payments.

4. **Alignment with Invoice Discounting Model**: This change aligns with the Invoice Discounting Model implementation by focusing on the fixed time period between issuance and payment.

## Note on Data Migration
No data migration is needed as this is purely a calculation change. The existing data model already stores both invoice date and due date for all invoices. 