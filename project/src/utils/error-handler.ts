// Centralized error handling utilities

import { ERROR_MESSAGES } from './constants';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = ERROR_MESSAGES.SESSION_EXPIRED) {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string) {
    super(message, 'FILE_UPLOAD_ERROR', 400);
  }
}

// Error handler utility functions
export const handleApiError = (error: any): AppError => {
  console.error('API Error:', error);

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new NetworkError();
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.detail || error.response.data?.message || error.message;

    switch (status) {
      case 400:
        return new ValidationError(message);
      case 401:
        return new AuthenticationError();
      case 404:
        return new AppError('Resource not found', 'NOT_FOUND', 404);
      case 500:
        return new AppError('Server error occurred', 'SERVER_ERROR', 500);
      default:
        return new AppError(message || 'An error occurred', 'HTTP_ERROR', status);
    }
  }

  // File upload errors
  if (error.message?.includes('file') || error.message?.includes('upload')) {
    return new FileUploadError(error.message);
  }

  // Generic error
  return new AppError(error.message || ERROR_MESSAGES.GENERIC_ERROR, 'UNKNOWN_ERROR');
};

export const handleFileValidation = (file: File): void => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf'];

  if (file.size > maxSize) {
    throw new FileUploadError(ERROR_MESSAGES.FILE_TOO_LARGE);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new FileUploadError(ERROR_MESSAGES.INVALID_FILE_TYPE);
  }
};

export const formatErrorMessage = (error: AppError | Error): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  // Fallback for unknown errors
  return ERROR_MESSAGES.GENERIC_ERROR;
};

// Toast notification helper (can be integrated with a toast library)
export const showErrorToast = (error: AppError | Error) => {
  const message = formatErrorMessage(error);
  console.error('Error:', message);
  // Here you would integrate with your preferred toast notification library
  // For now, we'll just log to console
};

export const showSuccessToast = (message: string) => {
  console.log('Success:', message);
  // Here you would integrate with your preferred toast notification library
};