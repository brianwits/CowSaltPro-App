import { useState, useCallback } from 'react';
import { ServiceError } from '../../services/data';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiStateResult<T> extends ApiState<T> {
  setData: (data: T | null) => void;
  startLoading: () => void;
  setError: (error: string | null) => void;
  handleError: (error: unknown) => void;
  reset: () => void;
}

export function useApiState<T>(initialData: T | null = null): UseApiStateResult<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      loading: false,
      error: null,
    }));
  }, []);

  const startLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
    }));
  }, []);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ServiceError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, [setError]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    setData,
    startLoading,
    setError,
    handleError,
    reset,
  };
}

export default useApiState; 