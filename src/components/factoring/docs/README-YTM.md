# Invoice Discounting Model Implementation

This document explains the implementation of the Invoice Discounting Model (similar to Yield-to-Maturity in fixed-income securities) in the Factoring module.

## Overview

The Invoice Discounting Model allows investors to purchase invoices at a configurable discount (e.g., 99% of face value) and receive the full face value upon payment. The yield is represented by the percentage gain over the investment period.

## Implementation Details

### 1. Invoice Discount Rate

Each invoice has a `factoringDiscountRate` field which specifies the percentage discount at which the invoice will be purchased. For example:
- A `factoringDiscountRate` of 1.0% means the investor pays 99% of the face value
- If an invoice has a face value of $100,000, the investor pays $99,000

### 2. Token Value Calculation

When tokenizing a pool of invoices, the system:
1. Calculates the total face value of all invoices in the pool
2. Calculates the discounted purchase value based on each invoice's discount rate
3. Mints tokens equal to the face value, but investors purchase them at the discounted value

#### Code Implementation

The key functions related to the Invoice Discounting Model are:

```typescript
// Calculate the discounted value of a pool based on invoice discount rates
const getDiscountedPoolValue = (poolId: string) => {
  const poolInvoices = invoices.filter(invoice => invoice.poolId === poolId);
  
  // Calculate total face value (sum of all invoice net amounts)
  const totalFaceValue = poolInvoices.reduce((sum, invoice) => 
    sum + invoice.netAmountDue, 0);
  
  // Calculate total discounted value based on each invoice's discount rate
  const totalDiscountedValue = poolInvoices.reduce((sum, invoice) => {
    const discountRate = 1 - (invoice.factoringDiscountRate / 100);
    return sum + (invoice.netAmountDue * discountRate);
  }, 0);
  
  return { 
    faceValue: totalFaceValue, 
    discountedValue: totalDiscountedValue,
    averageDiscountRate: totalDiscountedValue / totalFaceValue
  };
};

// Calculate token value based on the face value
const calculateTokenValue = (poolId: string, totalTokens: number) => {
  const { faceValue } = getDiscountedPoolValue(poolId);
  
  // Token value is face value divided by total tokens
  return faceValue / totalTokens;
};
```

### 3. Investment Return Mechanism

The yield mechanism works as follows:

1. **Investment**: Investors pay the discounted price for tokens (e.g., $0.99 per token)
2. **Token Value**: Each token represents a share of the full face value (e.g., $1.00 per token)
3. **Return**: The difference between purchase price and face value represents the investor's return

### 4. Example Scenario

For a pool with the following invoices:
- Invoice A: $100,000 face value, 1% discount rate
- Invoice B: $150,000 face value, 1.5% discount rate
- Invoice C: $250,000 face value, 0.8% discount rate

The calculations would be:
- Total Face Value: $500,000
- Total Discounted Value: $495,750
  - Invoice A: $99,000 (99% of $100,000)
  - Invoice B: $147,750 (98.5% of $150,000)
  - Invoice C: $248,000 (99.2% of $250,000)
- Average Discount Rate: 0.85%
- If 500,000 tokens are created, each token has a value of $1.00
- Investors pay $0.9915 per token ($495,750 / 500,000)
- Return: 0.85% over the investment period

### 5. Annualized Yield Calculation

For a 30-day investment period, the annualized yield would be:
- Simple Return: 0.85%
- Annualized Yield: (1 + 0.0085)^(365/30) - 1 ≈ 10.8% APY

## UI Implementation

The user interface displays:
- Face Value: The total value of invoices in the pool
- Purchase Price: The discounted value investors pay
- Discount: The difference between face value and purchase price
- Token Value: The face value divided by total tokens

## Feature Enhancements

1. Invoice-level discount rates allow for risk-based pricing
2. Average discount rate calculation provides pool-level yield metrics
3. Face value vs. discounted value comparison provides transparency
4. Token distribution reflects the yield to maturity mechanism

## Future Improvements

1. Add time-weighted calculations based on invoice maturity dates
2. Implement different discount rates based on payer credit quality
3. Add risk adjustment factors to the discount model
4. Create yield simulations based on historical payment patterns 