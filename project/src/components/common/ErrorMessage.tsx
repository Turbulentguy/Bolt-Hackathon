import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AppError } from '../../utils/error-handler';

interface ErrorMessageProps {
  error: AppError | Error | string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ 
  error, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof AppError 
      ? error.message 
      : error.message || 'An unexpected error occurred';

  const errorCode = error instanceof AppError ? error.code : undefined;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-700 font-medium">
            {errorCode ? `Error (${errorCode})` : 'Error'}
          </p>
          <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}