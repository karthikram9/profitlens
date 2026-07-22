export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: any;
}

export class ApiError extends Error {
  code: string;
  details?: any;
  status: number;

  constructor(message: string, code: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

const onRefreshed = (token: string) => {
  setAuthToken(token);
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;
  
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }
        const data = await refreshResponse.json();
        onRefreshed(data.access_token);
        
        const newHeaders = new Headers(options.headers);
        newHeaders.set('Authorization', `Bearer ${data.access_token}`);
        if (!(options.body instanceof FormData) && !newHeaders.has('Content-Type')) {
          newHeaders.set('Content-Type', 'application/json');
        }
        response = await fetch(url, { ...fetchOptions, headers: newHeaders });
      } catch (err) {
        window.location.href = '/auth?tab=login';
      } finally {
        isRefreshing = false;
      }
    } else {
      await new Promise<void>((resolve) => {
        refreshSubscribers.push((newToken) => {
          const newHeaders = new Headers(options.headers);
          newHeaders.set('Authorization', `Bearer ${newToken}`);
          if (!(options.body instanceof FormData) && !newHeaders.has('Content-Type')) {
            newHeaders.set('Content-Type', 'application/json');
          }
          fetch(url, { ...fetchOptions, headers: newHeaders }).then((res) => {
            response = res;
            resolve();
          });
        });
      });
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    if (data && data.error) {
      throw new ApiError(
        data.error.message || 'API request failed',
        data.error.code || 'UNKNOWN_ERROR',
        response.status,
        data.error.details
      );
    }
    // FastAPI raises HTTPException with a `detail` field; check it before generic fallback
    throw new ApiError(
      data.detail || data.message || 'An unexpected error occurred.',
      'HTTP_ERROR',
      response.status
    );
  }

  return data as T;
}
