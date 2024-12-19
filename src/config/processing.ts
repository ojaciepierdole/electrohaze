export const PROCESSING_CONFIG = {
  maxRetries: process.env.NEXT_PUBLIC_MAX_RETRIES ? parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES) : 3,
  retryDelay: process.env.NEXT_PUBLIC_RETRY_DELAY ? parseInt(process.env.NEXT_PUBLIC_RETRY_DELAY) : 1000,
  eventSourceTimeout: process.env.NEXT_PUBLIC_EVENT_SOURCE_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_EVENT_SOURCE_TIMEOUT) : 30000
}; 