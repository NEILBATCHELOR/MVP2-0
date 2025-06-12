// External API services
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
  message?: string;
  status: number;
}

export function handleApiError(error: any): ApiResponse {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || 'An unknown error occurred',
    message: error.message || 'API request failed',
    status: 500
  };
}

export async function makeApiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      message: 'Request successful',
      status: response.status
    };
  } catch (error: any) {
    return handleApiError(error);
  }
}
