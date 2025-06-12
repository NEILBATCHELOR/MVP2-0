# Onfido Implementation Guide

This guide walks you through setting up the Onfido identity verification service in your application.

## Prerequisites

1. An Onfido account with API access
2. Supabase project with Edge Functions enabled
3. Environment variables set up for both your frontend and Supabase Edge Functions

## Step 1: Set Up Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_ONFIDO_API_URL=https://api.onfido.com/v3
```

### Supabase Edge Functions
Set these in your Supabase dashboard under Settings > API:
```
ONFIDO_API_TOKEN=your_onfido_api_token
```

## Step 2: Deploy Edge Functions

Deploy the Onfido Edge Functions to your Supabase project:

```bash
supabase functions deploy onfido-create-applicant
supabase functions deploy onfido-create-check
supabase functions deploy onfido-generate-sdk-token
supabase functions deploy onfido-get-check-status
```

## Step 3: Database Schema

Ensure your database has the necessary columns for storing Onfido data:

```sql
ALTER TABLE investors 
ADD COLUMN onfido_applicant_id TEXT,
ADD COLUMN onfido_check_id TEXT,
ADD COLUMN kyc_status TEXT DEFAULT 'not_started',
ADD COLUMN kyc_details TEXT;
```

## Step 4: Frontend Integration

### Basic Verification Flow

This is the basic flow for verifying a user's identity:

1. **Create an Applicant**
```typescript
import { startVerification } from "@/lib/services/onfidoService";

const startKYC = async () => {
  const response = await startVerification({
    investorId: "investor-123",
    type: "individual",
    applicantData: {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      dob: "1990-01-01",
      country: "USA"
    }
  });

  if (response.success) {
    // Store applicantId and checkId or proceed to the next step
    const { applicantId, checkId } = response.data;
    setApplicantId(applicantId);
    
    // Proceed to Onfido SDK initialization
    initOnfidoSDK(applicantId);
  }
};
```

2. **Initialize Onfido SDK**
```typescript
import Onfido from 'onfido-sdk-ui';

const initOnfidoSDK = async (applicantId) => {
  // Generate SDK token
  const tokenResponse = await generateSdkToken(applicantId);
  
  if (tokenResponse.success) {
    // Initialize Onfido SDK with token
    const onfidoInstance = Onfido.init({
      token: tokenResponse.data.token,
      containerId: 'onfido-mount', // ID of the element to mount the SDK
      workflowRunId: null, // Optional: If using Onfido Studio
      steps: [
        {
          type: 'welcome',
          options: {
            title: 'Verify your identity',
          }
        },
        'document',
        'face',
        {
          type: 'complete',
          options: {
            message: 'Verification complete!'
          }
        }
      ],
      onComplete: (data) => {
        // Handle completion - the server will receive webhook events
        console.log('Verification completed:', data);
      }
    });
    
    // Store instance for later cleanup
    setOnfidoInstance(onfidoInstance);
  }
};
```

3. **Check Verification Status**
```typescript
import { getVerificationStatus } from "@/lib/services/onfidoService";

const checkStatus = async () => {
  const response = await getVerificationStatus("investor-123");
  
  if (response.success) {
    const { status, details } = response.data;
    
    // Update UI based on status
    switch(status) {
      case 'approved':
        setVerificationMessage('Your identity has been verified!');
        break;
      case 'pending':
        setVerificationMessage('Your verification is being processed...');
        break;
      case 'failed':
        setVerificationMessage('Verification failed. Please try again.');
        break;
      default:
        setVerificationMessage('Start your verification process.');
    }
  }
};
```

## Step 5: Handling Webhooks (Optional)

Onfido sends webhook events when verification checks are completed. To handle these events:

1. Create a webhook endpoint in your API or Supabase Edge Function.
2. Register the webhook URL in your Onfido dashboard.
3. Implement the `handleWebhookEvent` function to process events.

```typescript
// Example webhook endpoint in a Next.js API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Validate webhook signature
  // ... (implement signature validation)
  
  // Process webhook event
  const event = req.body;
  const result = await handleWebhookEvent(event);
  
  if (result.success) {
    return res.status(200).json({ received: true });
  } else {
    return res.status(400).json({ error: result.error });
  }
}
```

## Onfido Studio Integration (Advanced)

For more complex verification workflows, you can use Onfido Studio:

1. Create a workflow in the Onfido Dashboard.
2. Get the workflow ID.
3. Use the workflow ID when starting verification:

```typescript
// Example of running a workflow
const response = await startWorkflow({
  investorId: "investor-123",
  applicantId: "applicant-123",
  workflowId: "workflow-123"
});
```

## Troubleshooting

### Common Issues

1. **Token expired errors**: SDK tokens expire after 90 minutes. Generate a new token if this occurs.
2. **CORS issues**: Ensure your Supabase Edge Functions include proper CORS headers.
3. **'Invalid token' errors**: Verify that your Onfido API token is correctly set in environment variables.

### Testing

- Use Onfido's test documents for development (see [Onfido's test data documentation](https://documentation.onfido.com/))
- Monitor webhook events in the Onfido Dashboard

## Resources

- [Onfido API Documentation](https://documentation.onfido.com/api/latest/)
- [Onfido SDK Documentation](https://documentation.onfido.com/sdk/web/)
- [Onfido Studio Guide](https://documentation.onfido.com/studio-docs/) 