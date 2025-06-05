import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type ErrorType = 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504 | null;

interface UseHttpErrorHandlerResult {
  error: ErrorType;
  errorMessage: string | null;
  handleHttpError: (statusCode: number, message?: string) => void;
  clearError: () => void;
}

export function useHttpErrorHandler(): UseHttpErrorHandlerResult {
  const [error, setError] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleHttpError = useCallback((statusCode: number, message?: string) => {
    // Handle authentication errors
    if (statusCode === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
    
    // Set the error state for other error types
    setError(statusCode as ErrorType);
    setErrorMessage(message || null);
    
    // For critical errors, redirect to error page with status code
    if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
      navigate(`/error?status=${statusCode}`, { 
        state: { statusCode, message } 
      });
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorMessage(null);
  }, []);

  return { error, errorMessage, handleHttpError, clearError };
}
