import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Mail, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string | null;
  isGenerating: boolean;
  auditId?: string | null;
}

export function AuditReportModal({ isOpen, onClose, reportContent, isGenerating, auditId }: AuditReportModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEmailing, setIsEmailing] = useState(false);

  const handleViewReport = () => {
    if (auditId) {
      navigate(`/report/${auditId}`);
    }
  };

  const handleDownloadPDF = () => {
    if (auditId) {
      // Open in new tab and trigger print
      const reportUrl = `/report/${auditId}`;
      const newWindow = window.open(reportUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
      }
    }
  };

  const handleEmailReport = async () => {
    if (!auditId || !reportContent) return;
    
    setIsEmailing(true);
    try {
      const { error } = await supabase.functions.invoke('send-audit-report', {
        body: {
          auditId,
          reportContent,
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "The audit report has been sent to your email.",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send email",
        description: "There was an error sending the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailing(false);
    }
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
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button onClick={handleViewReport} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Report
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button 
                onClick={handleEmailReport} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={isEmailing}
              >
                <Mail className="w-4 h-4" />
                {isEmailing ? 'Sending...' : 'Email Report'}
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-lg p-4 bg-muted/30">
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: reportContent.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} 
                />
              </div>
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