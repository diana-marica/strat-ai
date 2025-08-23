import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string | null;
  isGenerating: boolean;
}

export function AuditReportModal({ isOpen, onClose, reportContent, isGenerating }: AuditReportModalProps) {
  const downloadReport = () => {
    if (!reportContent) return;
    
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-audit-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {isGenerating ? "Generating Your AI Audit Report..." : "Your AI Audit Report"}
          </DialogTitle>
          <DialogDescription>
            {isGenerating 
              ? "Please wait while we analyze your responses and create your personalized audit report."
              : "Your comprehensive AI readiness audit report is ready for download."
            }
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4 mx-auto"></div>
              <p className="text-muted-foreground">Analyzing responses and generating report...</p>
              <p className="text-sm text-muted-foreground mt-2">This typically takes 2-3 minutes</p>
            </div>
          </div>
        ) : reportContent ? (
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4">
              <Button onClick={downloadReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Report
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-lg p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm">{reportContent}</pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">Failed to generate report</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}