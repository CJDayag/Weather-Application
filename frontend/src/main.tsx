import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import errorReporter from './services/errorReporter';

// Initialize error reporter
errorReporter.initialize();

// Create a custom error handler for React errors
const handleError = (error: Error) => {
  console.error('Caught React error:', error);
  errorReporter.captureError({
    message: error.message,
    stack: error.stack,
    context: { source: 'React Error Boundary' }
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
