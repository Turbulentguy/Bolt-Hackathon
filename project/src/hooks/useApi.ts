// Custom hooks for API operations

import { useState, useCallback } from 'react';
import { handleApiError, AppError } from '../utils/error-handler';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error: any) {
      const appError = handleApiError(error);
      setState(prev => ({ ...prev, loading: false, error: appError }));
      options.onError?.(appError);
      throw appError;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Specialized hooks for common operations
export function useSearch() {
  return useApi({
    onSuccess: (data) => console.log('Search completed:', data.title),
    onError: (error) => console.error('Search failed:', error.message)
  });
}

export function useUpload() {
  return useApi({
    onSuccess: (data) => console.log('Upload completed:', data.filename),
    onError: (error) => console.error('Upload failed:', error.message)
  });
}

export function usePapers() {
  return useApi({
    onSuccess: (data) => console.log('Papers loaded:', data.papers?.length || 0),
    onError: (error) => console.error('Failed to load papers:', error.message)
  });
}

// Hook for managing multiple API states
export function useApiStates() {
  const search = useSearch();
  const upload = useUpload();
  const papers = usePapers();

  const isAnyLoading = search.loading || upload.loading || papers.loading;
  const hasAnyError = search.error || upload.error || papers.error;

  const resetAll = () => {
    search.reset();
    upload.reset();
    papers.reset();
  };

  return {
    search,
    upload,
    papers,
    isAnyLoading,
    hasAnyError,
    resetAll
  };
}