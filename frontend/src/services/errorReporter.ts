// Error tracking and reporting utility

interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorDetails[] = [];
  private readonly maxStoredErrors: number = 10;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  public initialize(): void {
    if (this.initialized) return;
    
    // Set up global error listeners
    window.addEventListener('error', this.handleWindowError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    this.initialized = true;
    console.log('Error reporter initialized');
  }

  private handleWindowError(event: ErrorEvent): void {
    this.captureError({
      message: event.message,
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  }

  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const message = typeof event.reason === 'string' 
      ? event.reason 
      : (event.reason?.message || 'Promise rejection with unknown reason');
    
    this.captureError({
      message,
      stack: event.reason?.stack,
      context: { type: 'unhandledRejection' }
    });
  }

  public captureError(error: { 
    message: string, 
    stack?: string, 
    context?: Record<string, any> 
  }): void {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      context: error.context || {},
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Log to console during development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error captured:', errorDetails);
    }
    
    // Store error
    this.errors.unshift(errorDetails);
    
    // Limit stored errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }
    
    // Send error to server
    this.sendErrorToServer(errorDetails).catch(console.error);
  }

  private async sendErrorToServer(error: ErrorDetails): Promise<void> {
    // Don't send errors in development mode
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // In a real implementation, you would send the error to your backend:
    /*
    try {
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silently fail to avoid infinite error loops
      console.warn('Failed to send error report to server');
    }
    */
  }
  
  public getRecentErrors(): ErrorDetails[] {
    return [...this.errors];
  }
  
  public clearErrors(): void {
    this.errors = [];
  }
}

// Create and export the singleton instance
const errorReporter = ErrorReporter.getInstance();
export default errorReporter;
