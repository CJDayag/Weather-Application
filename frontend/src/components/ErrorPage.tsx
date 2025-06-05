"use client";

import { useSearchParams, useLocation } from 'react-router-dom';
import ErrorFallback from '@/components/ErrorFallback';

type StatusCode = 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504;

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const location = useLocation();
  
  // Get error details from URL parameters or location state
  const statusParam = searchParams[0]?.get('status');
  const statusCode = statusParam ? parseInt(statusParam) as StatusCode : 
    (location.state?.statusCode as StatusCode) || 404;
  
  const message = location.state?.message || null;
  
  return (
    <ErrorFallback 
      statusCode={statusCode} 
      message={message} 
    />
  );
}
