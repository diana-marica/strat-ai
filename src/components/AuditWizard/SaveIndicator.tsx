import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface SaveIndicatorProps {
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaveTime?: Date;
}

export function SaveIndicator({ isAutoSaving, hasUnsavedChanges, lastSaveTime }: SaveIndicatorProps) {
  if (isAutoSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Saving...
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-warning">
        <AlertCircle className="w-4 h-4" />
        Unsaved changes
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle className="w-4 h-4" />
      {lastSaveTime ? `Saved at ${lastSaveTime.toLocaleTimeString()}` : 'All changes saved'}
    </div>
  );
}