import { useState, useCallback } from 'react';
import { ServiceError } from '../../database/models/types';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApiState<T>(fetchFn: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const startLoading = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  }, []);

  const setData = useCallback((data: T) => {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ServiceError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unknown error occurred');
    }
  }, [setError]);

  const execute = useCallback(async () => {
    try {
      startLoading();
      const data = await fetchFn();
      setData(data);
    } catch (error) {
      handleError(error);
    }
  }, [fetchFn, startLoading, setData, handleError]);

  return {
    ...state,
    execute,
    startLoading,
    setData,
    setError,
    isLoading: state.loading,
    setIsLoading: (loading: boolean) => setState(prev => ({ ...prev, loading })),
  };
}

export default useApiState; 