/**
 * useWheelLoader Hook
 * Manages wheel loading states with error handling
 */

import { useState, useCallback } from 'react';
import { WheelStep } from '@/Common/Types/Types';

interface UseWheelLoaderReturn {
  currentWheel: WheelStep | null;
  isLoading: boolean;
  error: Error | null;
  loadWheel: (loader: () => Promise<WheelStep>) => Promise<void>;
  setWheel: (wheel: WheelStep) => void;
  clearError: () => void;
}

export function useWheelLoader(initialWheel?: WheelStep): UseWheelLoaderReturn {
  const [currentWheel, setCurrentWheel] = useState<WheelStep | null>(initialWheel || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const loadWheel = useCallback(async (loader: () => Promise<WheelStep>) => {
    setIsLoading(true);
    setError(null);

    try {
      const wheel = await loader();
      setCurrentWheel(wheel);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load wheel');
      setError(error);
      console.error('[useWheelLoader] Error loading wheel:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setWheel = useCallback((wheel: WheelStep) => {
    setCurrentWheel(wheel);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentWheel,
    isLoading,
    error,
    loadWheel,
    setWheel,
    clearError
  };
}
