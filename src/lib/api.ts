// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Check if API is available
export const hasApiConnection = !!(import.meta.env.VITE_API_URL);

// Debug
console.log('🔍 API Connection Debug:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  hasApiConnection
});

