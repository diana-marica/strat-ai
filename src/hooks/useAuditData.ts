import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditData {
  [stepId: string]: {
    [fieldName: string]: any;
  };
}

interface UseAuditDataReturn {
  responses: AuditData;
  updateResponse: (stepId: number, fieldName: string, value: any) => void;
  generateReport: (reportPreferences?: string[]) => Promise<string | null>;
  isGenerating: boolean;
  auditId: string | null;
}

export function useAuditData(): UseAuditDataReturn {
  const [responses, setResponses] = useState<AuditData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);

  const updateResponse = (stepId: number, fieldName: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [fieldName]: value
      }
    }));
  };

  const generateReport = async (reportPreferences?: string[]): Promise<string | null> => {
    setIsGenerating(true);
    
    try {
      // Create a new audit record
      const { data: audit, error: createError } = await supabase
        .from('audits')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          responses: responses,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;
      
      setAuditId(audit.id);
      toast.success('Audit created, generating report...');

      // Call the edge function to generate the report
      const { data, error } = await supabase.functions.invoke('generate-audit-report', {
        body: {
          auditId: audit.id,
          responses: responses,
          reportPreferences: reportPreferences || []
        }
      });

      if (error) throw error;

      toast.success('Audit report generated successfully!');
      return data.reportContent;

    } catch (error: any) {
      console.error('Error generating audit report:', error);
      toast.error(error.message || 'Failed to generate audit report');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    responses,
    updateResponse,
    generateReport,
    isGenerating,
    auditId
  };
}