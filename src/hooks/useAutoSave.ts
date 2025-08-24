import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface AuditData {
  [stepId: string]: {
    [fieldName: string]: any;
  };
}

export function useAutoSave(
  data: AuditData, 
  saveFunction: (data: AuditData) => Promise<void>,
  delay: number = 2000
) {
  const debouncedData = useDebounce(data, delay);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Don't auto-save on initial load
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    // Don't save empty data
    if (Object.keys(debouncedData).length === 0) {
      return;
    }

    console.log('Auto-saving audit data...');
    saveFunction(debouncedData).catch(console.error);
  }, [debouncedData, saveFunction]);

  // Save to localStorage as backup
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem('audit-responses-backup', JSON.stringify(data));
    }
  }, [data]);

  return { isAutoSaving: hasInitialized.current && Object.keys(data).length > 0 };
}