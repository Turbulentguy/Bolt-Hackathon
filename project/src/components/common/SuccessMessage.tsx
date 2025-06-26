import React from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface SuccessMessageProps {
  title: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  className?: string;
}

export default function SuccessMessage({ 
  title,
  message,
  actionLabel,
  actionUrl,
  onAction,
  className = '' 
}: SuccessMessageProps) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-green-700 font-medium">{title}</p>
          {message && (
            <p className="text-green-600 text-sm mt-1">{message}</p>
          )}
          {(actionLabel && (actionUrl || onAction)) && (
            <div className="mt-3">
              {actionUrl ? (
                <a
                  href={actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200 text-sm font-medium inline-flex"
                >
                  <ExternalLink className="w-4 h-4" />
                  {actionLabel}
                </a>
              ) : (
                <button
                  onClick={onAction}
                  className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}