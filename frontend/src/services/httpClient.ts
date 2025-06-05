import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class HttpClient {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor(baseURL: string) {
    this.apiUrl = baseURL;
    this.client = axios.create({
      baseURL,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Get access token from local storage
        const token = localStorage.getItem('access_token');
        
        // If token exists, add to headers
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle authentication errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Try to refresh token
          if (originalRequest && this.shouldAttemptTokenRefresh()) {
            originalRequest._retry = true;
            try {
              await this.refreshToken();
              const token = localStorage.getItem('access_token');
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            } catch (refreshError) {
              this.handleAuthFailure();
              return Promise.reject(refreshError);
            }
          } else {
            this.handleAuthFailure();
          }
        }
        
        // For other errors, include helpful information
        if (error.response) {
          // The server responded with a status code outside of 2xx
          this.handleErrorResponse(error);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something else happened while setting up the request
          console.error('Error setting up request:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private shouldAttemptTokenRefresh(): boolean {
    const refreshToken = localStorage.getItem('refresh_token');
    return !!refreshToken;
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/api/token/refresh/`, {
        refresh: refreshToken
      });
      
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
      } else {
        throw new Error('Access token not received');
      }
    } catch (error) {
      console.error('Failed to refresh token', error);
      throw error;
    }
  }

  private handleAuthFailure(): void {
    // Clear tokens and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // If not in a login-related route, redirect to login
    if (
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/signup') &&
      !window.location.pathname.includes('/forgot-password') &&
      !window.location.pathname.includes('/reset-password')
    ) {
      window.location.href = '/login';
    }
  }

  private handleErrorResponse(error: AxiosError): void {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;
    
    // Format user-friendly error message
    let errorMessage = 'Something went wrong. Please try again.';
    
    if (errorData?.detail) {
      errorMessage = errorData.detail;
    } else if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    // Log errors for debugging (in development)
    if (process.env.NODE_ENV !== 'production') {
      console.error(`HTTP Error ${statusCode}:`, error.response);
    }
    
    // For critical errors, navigate to error page
    if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
      window.location.href = `/error?status=${statusCode}`;
    }
  }

  // Public methods for API calls
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }
}
