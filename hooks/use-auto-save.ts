import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      setLastSaved(new Date());
      previousDataRef.current = data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      console.error('Auto-save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
  };
}
