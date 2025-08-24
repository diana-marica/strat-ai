import { useState, useEffect } from 'react';

interface AuditData {
  [stepId: string]: {
    [fieldName: string]: any;
  };
}

export function useAutoSaveWithRestore() {
  const [restoredData, setRestoredData] = useState<AuditData | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadBackupData = () => {
      try {
        const backup = localStorage.getItem('audit-responses-backup');
        if (backup) {
          const parsed = JSON.parse(backup);
          if (Object.keys(parsed).length > 0) {
            setRestoredData(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load backup data:', error);
      } finally {
        setHasLoaded(true);
      }
    };

    loadBackupData();
  }, []);

  const clearBackup = () => {
    localStorage.removeItem('audit-responses-backup');
    setRestoredData(null);
  };

  return {
    restoredData,
    hasLoaded,
    clearBackup
  };
}