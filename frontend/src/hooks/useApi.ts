import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { HttpClient } from '@/services/httpClient';
import errorReporter from '@/services/errorReporter';

// Create a singleton HTTP client instance
const API_URL = import.meta.env.VITE_API_URL || '';
const httpClient = new HttpClient(API_URL);

interface ApiHookOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  redirectOnUnauthorized?: boolean;
}

interface ApiHookResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<T | null>;
  clearError: () => void;
}

export function useApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  payload?: any,
  options: ApiHookOptions = {}
): ApiHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    redirectOnUnauthorized = true
  } = options;

  const clearError = useCallback(() => setError(null), []);

  const fetchData = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (method) {
        case 'GET':
          response = await httpClient.get<T>(endpoint);
          break;
        case 'POST':
          response = await httpClient.post<T>(endpoint, payload);
          break;
        case 'PUT':
          response = await httpClient.put<T>(endpoint, payload);
          break;
        case 'DELETE':
          response = await httpClient.delete<T>(endpoint);
          break;
        case 'PATCH':
          response = await httpClient.patch<T>(endpoint, payload);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return response.data;
    } catch (err) {
      const error = err as any;
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'An error occurred';
      
      setError(new Error(errorMessage));
      
      // Report error
      errorReporter.captureError({
        message: errorMessage,
        stack: error.stack,
        context: {
          endpoint,
          method,
          statusCode: error.response?.status,
          responseData: error.response?.data
        }
      });
      
      // Handle specific error status codes
      if (error.response) {
        const statusCode = error.response.status;
        
        // Unauthorized
        if (statusCode === 401 && redirectOnUnauthorized) {
          navigate('/login');
        }
        
        // Forbidden
        if (statusCode === 403) {
          // Handle forbidden access
          if (showErrorToast) {
            toast.error('You do not have permission to access this resource');
          }
        }
        
        // Not Found
        if (statusCode === 404) {
          // Handle not found
          if (showErrorToast) {
            toast.error('The requested resource was not found');
          }
        }
        
        // Server Error
        if (statusCode >= 500) {
          if (showErrorToast) {
            toast.error('Server error. Please try again later.');
          }
          
          // For critical server errors, navigate to error page
          navigate(`/error?status=${statusCode}`, {
            state: { 
              statusCode, 
              message: errorMessage 
            }
          });
        } else {
          // For non-server errors, show toast if enabled
          if (showErrorToast) {
            toast.error(errorMessage);
          }
        }
      } else {
        // Network error or other client-side error
        if (showErrorToast) {
          toast.error('Network error. Please check your connection.');
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, payload, navigate, showSuccessToast, showErrorToast, successMessage, redirectOnUnauthorized]);

  return { data, loading, error, fetchData, clearError };
}
