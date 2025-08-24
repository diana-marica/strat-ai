import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface AutoSaveStatusProps {
  isAutoSaving: boolean;
  auditId: string | null;
}

export function AutoSaveStatus({ isAutoSaving, auditId }: AutoSaveStatusProps) {
  if (isAutoSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Saving changes...
      </div>
    );
  }

  if (auditId) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="w-4 h-4" />
        All changes saved
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <AlertCircle className="w-4 h-4" />
      Start typing to begin saving
    </div>
  );
}