import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

interface AuditData {
  [stepId: string]: {
    [fieldName: string]: any;
  };
}

export function useAutoSave(
  data: AuditData, 
  saveFunction: (data: AuditData) => Promise<void>,
  delay: number = 5000
) {
  const debouncedData = useDebounce(data, delay);
  const hasInitialized = useRef(false);
  const lastSavedData = useRef<string>('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);

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

    // Don't save if data hasn't changed
    const currentDataString = JSON.stringify(debouncedData);
    if (currentDataString === lastSavedData.current) {
      return;
    }

    // Don't save if already saving
    if (isAutoSaving) {
      return;
    }

    const performSave = async () => {
      setIsAutoSaving(true);
      try {
        console.log('Auto-saving audit data...');
        await saveFunction(debouncedData);
        lastSavedData.current = currentDataString;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    };

    performSave();
  }, [debouncedData, saveFunction, isAutoSaving]);

  // Save to localStorage as backup
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem('audit-responses-backup', JSON.stringify(data));
    }
  }, [data]);

  return { 
    isAutoSaving: isAutoSaving && hasInitialized.current && Object.keys(data).length > 0 
  };
}