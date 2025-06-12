# Subscriptions Components

## Overview
The Subscriptions components handle subscription plan management, payment processing, invoicing, and subscription status tracking. These components manage the commercial relationship between users and the platform.

## Components

### Core Subscription Components
- **SubscriptionManager.tsx**: Main component for managing subscriptions, including plan selection, payment, and status.
- **SubscriptionDetails.tsx**: Displays detailed information about a user's subscription.
- **SubscriptionPlans.tsx**: Displays available subscription plans with features and pricing.
- **SubscriptionBadge.tsx**: Visual indicator of subscription status and type.

### Payment Components
- **PaymentMethodForm.tsx**: Form for collecting and validating payment method information.
- **SubscriptionInvoice.tsx**: Displays and generates subscription invoices.

## Usage
These components are used in the subscription and billing sections of the application, allowing users to select plans, make payments, and manage their subscriptions.

## Dependencies
- React
- UI component library
- Payment processing libraries
- PDF generation for invoices