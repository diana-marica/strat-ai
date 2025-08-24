import { useState, useEffect } from 'react';
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
  createOrUpdateAudit: (data: AuditData) => Promise<string>;
}

export function useAuditData(): UseAuditDataReturn {
  const [responses, setResponses] = useState<AuditData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);

  // Load existing draft audit on mount
  useEffect(() => {
    loadExistingDraft();
  }, []);

  const loadExistingDraft = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: existingAudit, error } = await supabase
        .from('audits')
        .select('id, responses')
        .eq('user_id', user.user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existingAudit) {
        setAuditId(existingAudit.id);
        if (existingAudit.responses && Object.keys(existingAudit.responses as object).length > 0) {
          setResponses(existingAudit.responses as AuditData);
        }
      }
    } catch (error) {
      console.error('Error loading existing draft:', error);
    }
  };

  const updateResponse = (stepId: number, fieldName: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [fieldName]: value
      }
    }));
  };

  const createOrUpdateAudit = async (data: AuditData): Promise<string> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No authenticated user');

      if (auditId) {
        // Update existing audit
        const { error } = await supabase
          .from('audits')
          .update({ responses: data, updated_at: new Date().toISOString() })
          .eq('id', auditId);
        
        if (error) throw error;
        return auditId;
      } else {
        // Create new audit
        const { data: audit, error } = await supabase
          .from('audits')
          .insert({
            user_id: user.user.id,
            responses: data,
            status: 'draft'
          })
          .select('id')
          .single();

        if (error) throw error;
        setAuditId(audit.id);
        return audit.id;
      }
    } catch (error) {
      console.error('Error creating/updating audit:', error);
      throw error;
    }
  };

  const generateReport = async (reportPreferences?: string[]): Promise<string | null> => {
    setIsGenerating(true);
    
    try {
      // Ensure we have an audit record
      const currentAuditId = auditId || await createOrUpdateAudit(responses);
      
      // Update audit status to generating
      await supabase
        .from('audits')
        .update({ status: 'generating', responses: responses })
        .eq('id', currentAuditId);

      toast.success('Generating report...');

      // Call the edge function to generate the report
      const { data, error } = await supabase.functions.invoke('generate-audit-report', {
        body: {
          auditId: currentAuditId,
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
    auditId,
    createOrUpdateAudit
  };
}