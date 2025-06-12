# API Server Documentation

## Overview

This project includes an Express-based API server to handle backend requests. The server is built with TypeScript and provides versioned API endpoints for the application.

## Features

- Express server with TypeScript support
- API versioning (/api/v1/...)
- CORS support for cross-origin requests
- JSON request body parsing
- Health check endpoint
- Error handling middleware
- Authentication middleware

## API Endpoints

### Health Check

- `GET /api/health` - Returns the current status of the API server

### Policies

- `GET /api/v1/policies` - Get all policies
  - Query parameters:
    - `includeInactive` - (true/false) Whether to include inactive policies
  
- `GET /api/v1/policies/:id` - Get a policy by ID

- `POST /api/v1/policies` - Create a new policy
  - Requires policy data in request body
  
- `PUT /api/v1/policies/:id` - Update a policy
  - Requires policy data in request body with matching ID

### Policy Templates

- `GET /api/v1/templates` - Get all policy templates

- `GET /api/v1/templates/:id` - Get a policy template by ID

- `POST /api/v1/templates` - Create a new policy template
  - Requires template data in request body:
    - `name` - Template name
    - `description` - Template description
    - `policyData` - Policy data

## Authentication

All API endpoints (except the health check) require authentication. The authentication is handled by the `requireAuth` middleware, which checks for a valid user ID and adds it to the request object.

## Running the Server

### Development

```bash
# Run only the API server
npm run server:dev

# Run both frontend and API server
npm run dev:all
```

### Production

```bash
# Build both frontend and API server
npm run build:all

# Run the API server
npm run server
```

## Configuration

The server listens on port 3001 by default, but you can change this by setting the `PORT` environment variable.

## Error Handling

The server includes a global error handler that catches any uncaught errors and returns a standard error response with a 500 status code.

## TypeScript Integration

The server uses TypeScript for type safety. The types for the Express request object have been extended to include the `userId` property.