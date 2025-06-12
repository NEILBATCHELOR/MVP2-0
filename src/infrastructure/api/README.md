# Token Deployment API Documentation

The Token Deployment API provides endpoints for managing the deployment and verification of tokens to various blockchain networks. This API integrates with the Token Deployment Service to handle the entire token deployment lifecycle.

## Architecture

The API follows a layered architecture pattern:

1. **Routes**: Define API endpoints and handle middleware integration
2. **Controllers**: Process HTTP requests and responses
3. **Services**: Implement business logic and integration with blockchain providers
4. **Validation**: Ensure request data integrity and format

## API Endpoints

### Token Deployment Endpoints

#### Initialize Deployment

```
POST /api/deployment/initialize
```

Initializes a new token deployment process.

**Request Body:**
```json
{
  "projectId": "uuid",
  "tokenId": "uuid",
  "blockchain": "ethereum",
  "environment": "testnet",
  "keyId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "string",
  "status": "PENDING",
  "message": "Deployment initialized successfully"
}
```

#### Execute Deployment

```
POST /api/deployment/execute
```

Executes a token deployment transaction.

**Request Body:**
```json
{
  "projectId": "uuid",
  "tokenId": "uuid",
  "blockchain": "ethereum",
  "environment": "testnet",
  "keyId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "status": "DEPLOYING",
    "contractAddress": "0x...",
    "transactionHash": "0x...",
    "blockNumber": 12345678
  }
}
```

#### Get Deployment Status

```
GET /api/deployment/status/:tokenId
```

Retrieves the current status of a token deployment.

**Response:**
```json
{
  "success": true,
  "status": "DEPLOYED",
  "details": {
    "tokenAddress": "0x...",
    "blockchain": "ethereum",
    "transactionHash": "0x...",
    "blockNumber": 12345678,
    "timestamp": "2023-05-21T16:45:32Z",
    "transactionDetails": {
      "confirmations": 10,
      "gasUsed": "4500000",
      "effectiveGasPrice": "20000000000"
    }
  }
}
```

#### Get Deployment History

```
GET /api/deployment/history/:tokenId?limit=10&offset=0
```

Retrieves the deployment history for a token.

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "token_id": "uuid",
      "status": "DEPLOYED",
      "blockchain": "ethereum",
      "environment": "testnet",
      "address": "0x...",
      "transaction_hash": "0x...",
      "timestamp": "2023-05-21T16:45:32Z"
    }
  ],
  "totalCount": 1
}
```

### Contract Verification Endpoints

#### Verify Contract

```
POST /api/deployment/verify
```

Initiates the verification of a deployed contract on the block explorer.

**Request Body:**
```json
{
  "tokenId": "uuid",
  "blockchain": "ethereum",
  "contractAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "verificationId": "string",
  "message": "Contract verification initiated. This process may take a few minutes."
}
```

#### Check Verification Status

```
GET /api/deployment/verify/status/:verificationId
```

Checks the status of a contract verification.

**Response:**
```json
{
  "success": true,
  "status": "pending",
  "message": "Verification in progress. Please check back in a few minutes."
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP Status codes:
- 400: Bad Request (Invalid input)
- 401: Unauthorized (Missing or invalid authentication)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found (Resource not found)
- 500: Internal Server Error (Server-side error)

## Authentication and Authorization

All API endpoints require authentication using JWT tokens. Some endpoints also require specific project access permissions.

## Database Schema

### Token Deployment History

```sql
CREATE TABLE token_deployment_history (
  id UUID PRIMARY KEY,
  token_id UUID REFERENCES tokens(id),
  project_id UUID REFERENCES projects(id),
  status TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  environment TEXT NOT NULL,
  address TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL
);
```

### Token Deployment Notifications

```sql
CREATE TABLE token_deployment_notifications (
  id UUID PRIMARY KEY,
  token_id UUID REFERENCES tokens(id),
  deployment_id UUID REFERENCES token_deployment_history(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL
);
```

### Token Contract Events

```sql
CREATE TABLE token_contract_events (
  id UUID PRIMARY KEY,
  token_id UUID REFERENCES tokens(id),
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);
```

## Security Considerations

1. All sensitive blockchain keys and mnemonics are stored encrypted
2. API endpoints use HTTPS for secure data transmission
3. JWT tokens have limited lifespans and proper scope restrictions
4. Database access is controlled through Supabase RLS policies
5. Input validation is performed on all API requests

## Rate Limiting

API endpoints implement rate limiting to prevent abuse:
- Maximum 10 requests per minute for status endpoints
- Maximum 5 requests per minute for deployment endpoints

## Integration with Block Explorers

The verification endpoints integrate with the following block explorers:
- Etherscan (Ethereum)
- Polygonscan (Polygon)
- Arbiscan (Arbitrum)
- Optimistic Etherscan (Optimism)
- Basescan (Base)
- BscScan (Binance Smart Chain)

## Environment Variables

The API uses the following environment variables from the `.env` file:

```
ETHEREUM_RPC_URL=https://...
POLYGON_RPC_URL=https://...
ARBITRUM_RPC_URL=https://...
OPTIMISM_RPC_URL=https://...
BASE_RPC_URL=https://...
BSC_RPC_URL=https://...

ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
ARBISCAN_API_KEY=
OPTIMISTIC_ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
BSCSCAN_API_KEY=
```

## API Testing

The API includes comprehensive testing:
- Unit tests for API services
- Integration tests for controllers
- End-to-end tests for deployment flows

Run tests with:
```
npm run test:api
```