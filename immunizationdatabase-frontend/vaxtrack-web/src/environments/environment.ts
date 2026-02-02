export const environment = {
  production: false,
  apiUrl: 'https://immunizationdb-backend.onrender.com/api',
  useMockAuth: false, // Set to true for development without backend
  enableApiLogging: true, // Enable request/response logging in development
  enableErrorRetry: true, // Enable automatic retry for transient failures
  maxRetryAttempts: 3, // Maximum number of retry attempts
  retryDelay: 1000 // Delay between retries in milliseconds
};



