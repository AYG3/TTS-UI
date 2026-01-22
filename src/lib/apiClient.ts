/**
 * API Client
 * Centralized HTTP client with error handling
 */

import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/types';

// Backend API runs on port 3001, Next.js frontend runs on port 3000
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const message =
      error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
