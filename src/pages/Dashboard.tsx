import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageCircle, 
  Download, 
  Calendar,
  Plus,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Audit {
  id: string;
  title: string;
  status: string;
  created_at: string;
  report_content: string | null;
  report_url: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error: any) {
      console.error('Error loading audits:', error);
      toast.error('Failed to load audits');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { variant: 'secondary' as const, label: 'Draft' },
      'generating': { variant: 'default' as const, label: 'Generating...' },
      'completed': { variant: 'default' as const, label: 'Completed' },
      'failed': { variant: 'destructive' as const, label: 'Failed' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const downloadReport = async (audit: Audit) => {
    if (!audit.report_content) {
      toast.error('No report available for download');
      return;
    }

    try {
      // Use the new browser-based PDF generation
      const reportUrl = `/report/${audit.id}`;
      const newWindow = window.open(reportUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Audit Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and review your AI readiness assessments
            </p>
          </div>
          <Button 
            onClick={() => navigate('/audit/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Audit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Audits</p>
                <p className="text-3xl font-bold">{audits.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">
                  {audits.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">
                  {audits.filter(a => ['draft', 'generating'].includes(a.status)).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Audits List */}
        <Card className="card-gradient">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Your Audits</h2>
          </div>
          <div className="p-6">
            {audits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No audits yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first AI readiness audit
                </p>
                <Button onClick={() => navigate('/audit/new')}>
                  Create Your First Audit
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {audits.map((audit) => (
                  <Card key={audit.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{audit.title}</h3>
                          {getStatusBadge(audit.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {format(new Date(audit.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/audit/${audit.id}/chat`)}
                              className="flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Discuss
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReport(audit)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </>
                        )}
                        {['draft', 'generating'].includes(audit.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/audit/new?continue=${audit.id}`)}
                            className="flex items-center gap-2"
                          >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}