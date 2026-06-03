# @monorepo/shared-api-client

Shared HTTP API client library with interceptors, error handling, and TypeScript support.

## Features

- 🚀 **Modern Fetch API** - Built on top of native fetch
- 🔒 **Type-Safe** - Full TypeScript support
- ⚙️ **Interceptors** - Request and response interceptors for cross-cutting concerns
- 🛡️ **Error Handling** - Standardized error responses using ApiResponse format
- ⏱️ **Timeout Support** - Configurable request timeouts
- 🔌 **Easy Integration** - Works seamlessly with @monorepo/shared-types

## Installation

```bash
pnpm add @monorepo/shared-api-client
```

## Usage

### Basic Setup

```typescript
import { createHttpClient } from '@monorepo/shared-api-client';

// Create a client instance
const apiClient = createHttpClient({
  baseUrl: 'http://api.example.com',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Making Requests

```typescript
// GET request
const users = await apiClient.get('/users');

// POST request
const newUser = await apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updated = await apiClient.put('/users/1', {
  name: 'Jane Doe',
});

// PATCH request
const patched = await apiClient.patch('/users/1', {
  email: 'jane@example.com',
});

// DELETE request
const deleted = await apiClient.delete('/users/1');
```

### Response Handling

All responses follow the `ApiResponse<T>` format:

```typescript
const response = await apiClient.get<User>('/users/1');

if (response.success) {
  console.log('User:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Authentication

```typescript
// Set auth token
apiClient.setAuthToken('your-jwt-token');

// All subsequent requests will include the Authorization header
const protected = await apiClient.get('/protected-route');

// Clear token when logging out
apiClient.clearAuthToken();
```

### Request Interceptors

```typescript
apiClient.addRequestInterceptor({
  onRequest: async (config) => {
    console.log('Outgoing request:', config);
    
    // Modify config as needed
    config.headers = {
      ...config.headers,
      'X-Request-ID': Math.random().toString(),
    };
    
    return config;
  },
  onError: async (error) => {
    console.error('Request error:', error);
    return error;
  },
});
```

### Response Interceptors

```typescript
apiClient.addResponseInterceptor({
  onResponse: async (response, data) => {
    console.log('Response received:', response.status, data);
    
    // Transform data as needed
    if (Array.isArray(data)) {
      return data.map(item => ({ ...item, _received: new Date() }));
    }
    
    return data;
  },
  onError: async (error) => {
    console.error('Response error:', error);
    
    // Handle specific errors
    if (error.message.includes('401')) {
      // Handle unauthorized
    }
    
    return error;
  },
});
```

### Global Error Handling

```typescript
const apiClient = createHttpClient(
  { baseUrl: 'http://api.example.com' },
  {
    responseInterceptors: [
      {
        onError: async (error) => {
          // Log all errors
          console.error('API Error:', error);
          
          // Show toast notification
          // showErrorToast(error.message);
          
          return error;
        },
      },
    ],
  }
);
```

### Type-Safe Requests

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Fully typed response
const response = await apiClient.get<User>('/users/1');

// Type checking works
if (response.success && response.data) {
  console.log(response.data.name); // ✓ Type safe
  console.log(response.data.invalid); // ✗ TypeScript error
}
```

### Handling Different Content Types

The client automatically handles JSON responses. For other content types:

```typescript
// Will parse as JSON if Content-Type is application/json
// Otherwise returns raw text
const response = await apiClient.get('/export');
```

## Error Handling

```typescript
try {
  const response = await apiClient.post('/users', userData);
  
  if (!response.success) {
    console.error('API Error:', response.error);
    // Handle API error
  }
} catch (error) {
  if (error instanceof Error) {
    console.error('Network Error:', error.message);
    // Handle network error
  }
}
```

## Configuration Options

```typescript
interface HttpClientConfig {
  baseUrl?: string;      // Base URL for all requests
  timeout?: number;      // Request timeout in milliseconds (default: 30000)
  headers?: Record<string, string>; // Default headers
}
```

## Building

```bash
pnpm build
```

## Type Checking

```bash
pnpm type-check
```

## Integration with Frontend Apps

All frontend applications in the monorepo should use this shared client:

```typescript
import { createHttpClient } from '@monorepo/shared-api-client';

// In your app initialization
export const apiClient = createHttpClient({
  baseUrl: process.env.REACT_APP_API_URL,
});
```

Then use it throughout your application:

```typescript
const { data: user } = await apiClient.get<User>('/me');
```
