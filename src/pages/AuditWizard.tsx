import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuditProgress } from "@/components/AuditWizard/AuditProgress";
import { AuditReportModal } from "@/components/AuditWizard/AuditReportModal";
import { FormAssistant } from "@/components/AuditWizard/FormAssistant";
import { AutoSaveStatus } from "@/components/AuditWizard/AutoSaveStatus";
import { ArrowLeft, ArrowRight, Save, CheckCircle, Circle, Loader2, HelpCircle } from "lucide-react";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useAuditData } from "@/hooks/useAuditData";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useAutoSaveWithRestore } from "@/hooks/useAutoSaveWithRestore";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const auditSteps = [
  {
    id: 1,
    title: "Company Profile",
    description: "Basic information about your organization",
    completed: false
  },
  {
    id: 2,
    title: "Current AI Use & Tooling",
    description: "Inventory of AI tools and use cases",
    completed: false
  },
  {
    id: 3,
    title: "Data Landscape",
    description: "Data infrastructure and governance",
    completed: false
  },
  {
    id: 4,
    title: "Architecture & MLOps",
    description: "Technical infrastructure assessment",
    completed: false
  },
  {
    id: 5,
    title: "Governance & Compliance",
    description: "GDPR, security, and risk management",
    completed: false
  },
  {
    id: 6,
    title: "Security & Privacy",
    description: "Data protection and access controls",
    completed: false
  },
  {
    id: 7,
    title: "People & Skills",
    description: "Team capabilities and training needs",
    completed: false
  },
  {
    id: 8,
    title: "Delivery & Change Management",
    description: "Implementation processes and adoption",
    completed: false
  },
  {
    id: 9,
    title: "Business Impact & ROI",
    description: "Value measurement and tracking",
    completed: false
  },
  {
    id: 10,
    title: "Summary & Generation",
    description: "Review and generate audit report",
    completed: false
  }
];

export default function AuditWizard() {
  const { user, loading } = useRequireAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(auditSteps);
  const { responses, updateResponse, generateReport, isGenerating, auditId, createOrUpdateAudit } = useAuditData();
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFormAssistant, setShowFormAssistant] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const { restoredData, hasLoaded, clearBackup } = useAutoSaveWithRestore();
  
  // Auto-save status
  const { isAutoSaving } = useAutoSave(responses, async (data) => {
    if (!user || Object.keys(data).length === 0) return;
    
    try {
      await createOrUpdateAudit(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 5000);

  // Data restoration effect
  useEffect(() => {
    if (hasLoaded && restoredData && Object.keys(responses).length === 0 && !auditId) {
      // Show restoration prompt only if no existing audit was found
      const shouldRestore = window.confirm(
        'We found some unsaved audit data. Would you like to restore it?'
      );
      
      if (shouldRestore) {
        // Restore the data by updating each response
        Object.keys(restoredData).forEach(stepId => {
          Object.keys(restoredData[stepId]).forEach(fieldName => {
            updateResponse(parseInt(stepId), fieldName, restoredData[stepId][fieldName]);
          });
        });
        
        toast('Your previous responses have been restored!', { 
          description: 'You can continue where you left off.' 
        });
      }
      
      clearBackup();
    }
  }, [hasLoaded, restoredData, responses, updateResponse, clearBackup, auditId]);

  // Handle text selection for AI assistant
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 5) {
        setSelectedText(selection.toString().trim());
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  const handleNext = async () => {
    if (currentStep < auditSteps.length) {
      // Mark current step as completed
      setSteps(prev => 
        prev.map(step => 
          step.id === currentStep 
            ? { ...step, completed: true }
            : step
        )
      );
      setCurrentStep(currentStep + 1);
    } else {
      // Generate audit report on final step
      setShowReportModal(true);
      const reportPreferences = getReportPreferences();
      const content = await generateReport(reportPreferences);
      if (content) {
        setReportContent(content);
      }
    }
  };

  const getReportPreferences = (): string[] => {
    // Get selected report preferences from step 10
    const step10Data = responses[10] || {};
    const preferences: string[] = [];
    
    if (step10Data.executiveSummary) preferences.push('Executive Summary Focus');
    if (step10Data.technicalDetails) preferences.push('Technical Implementation Details');
    if (step10Data.complianceReport) preferences.push('Compliance & Risk Assessment');
    if (step10Data.implementationPlan) preferences.push('Implementation Roadmap');
    if (step10Data.roiAnalysis) preferences.push('ROI & Business Impact');
    
    return preferences;
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Company Profile</h2>
            <p className="text-muted-foreground">
              Let's start with some basic information about your organization to tailor the audit.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Acme Corporation"
                  value={responses[1]?.companyName || ''}
                  onChange={(e) => updateResponse(1, 'companyName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={responses[1]?.industry || ''}
                  onChange={(e) => updateResponse(1, 'industry', e.target.value)}
                >
                  <option>Select industry...</option>
                  <option>Technology</option>
                  <option>Financial Services</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Size</label>
                <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option>Select size...</option>
                  <option>1-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-1000 employees</option>
                  <option>1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option>Select country...</option>
                  <option>Romania</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>United Kingdom</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Strategic AI Goals (Next 12 Months)
              </label>
              <textarea 
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                placeholder="Describe your key objectives for AI adoption..."
                value={responses[1]?.strategicGoals || ''}
                onChange={(e) => updateResponse(1, 'strategicGoals', e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Current AI Use & Tooling</h2>
            <p className="text-muted-foreground">
              Help us understand your current AI tools and how they're being used across your organization.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">AI Tools Currently in Use</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'ChatGPT/GPT-4', 'GitHub Copilot', 'Microsoft Copilot', 'Google Bard/Gemini',
                    'Claude (Anthropic)', 'Azure OpenAI', 'AWS SageMaker', 'Google Vertex AI',
                    'Custom LLM Implementation', 'Other AI Tools'
                  ].map((tool) => (
                    <label key={tool} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-border" 
                        checked={responses[2]?.aiTools?.includes(tool) || false}
                        onChange={(e) => {
                          const currentTools = responses[2]?.aiTools || [];
                          const updatedTools = e.target.checked 
                            ? [...currentTools, tool]
                            : currentTools.filter((t: string) => t !== tool);
                          updateResponse(2, 'aiTools', updatedTools);
                        }}
                      />
                      <span className="text-sm">{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Active Users (%)</label>
                  <select 
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={responses[2]?.activeUsers || ''}
                    onChange={(e) => updateResponse(2, 'activeUsers', e.target.value)}
                  >
                    <option>Select percentage...</option>
                    <option>0-10%</option>
                    <option>10-25%</option>
                    <option>25-50%</option>
                    <option>50-75%</option>
                    <option>75-100%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Implementation Stage</label>
                  <select 
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={responses[2]?.implementationStage || ''}
                    onChange={(e) => updateResponse(2, 'implementationStage', e.target.value)}
                  >
                    <option value="">Select stage...</option>
                    <option>Pilot/Testing</option>
                    <option>Limited Production</option>
                    <option>Full Production</option>
                    <option>Enterprise-wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Primary Use Cases</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    'Code Generation', 'Content Creation', 'Data Analysis', 'Customer Support',
                    'Document Processing', 'Translation', 'Research & Insights', 'Automation',
                    'Decision Support'
                  ].map((useCase) => (
                    <label key={useCase} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-border"
                        checked={responses[2]?.useCases?.includes(useCase) || false}
                        onChange={(e) => {
                          const currentUseCases = responses[2]?.useCases || [];
                          const updatedUseCases = e.target.checked 
                            ? [...currentUseCases, useCase]
                            : currentUseCases.filter((u: string) => u !== useCase);
                          updateResponse(2, 'useCases', updatedUseCases);
                        }}
                      />
                      <span className="text-sm">{useCase}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shadow AI Detection</label>
                <select 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={responses[2]?.shadowAI || ''}
                  onChange={(e) => updateResponse(2, 'shadowAI', e.target.value)}
                >
                  <option value="">How aware are you of unofficial AI tool usage?</option>
                  <option>Fully monitored - all usage tracked</option>
                  <option>Partially aware - some detection in place</option>
                  <option>Limited visibility - occasional surveys</option>
                  <option>No visibility - unaware of shadow usage</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Data Landscape</h2>
            <p className="text-muted-foreground">
              Assess your data infrastructure, governance, and quality for AI readiness.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Data Infrastructure</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Data Lake (S3, ADLS, GCS)', 'Data Warehouse (Snowflake, BigQuery, Redshift)',
                    'Data Catalog (DataHub, Collibra)', 'ETL/ELT Tools (Airflow, dbt, Fivetran)',
                    'Feature Store (Feast, Tecton)', 'Vector Database (Pinecone, Chroma, pgvector)',
                    'Streaming (Kafka, Kinesis)', 'Data Quality Tools'
                  ].map((infra) => (
                    <label key={infra} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{infra}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Volume</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select data volume...</option>
                    <option>Less than 1 TB</option>
                    <option>1-10 TB</option>
                    <option>10-100 TB</option>
                    <option>100 TB - 1 PB</option>
                    <option>More than 1 PB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Quality</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Rate your data quality...</option>
                    <option>Excellent - Clean, validated, monitored</option>
                    <option>Good - Mostly clean with some issues</option>
                    <option>Fair - Regular quality issues</option>
                    <option>Poor - Significant quality problems</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Data Governance & Privacy</label>
                <div className="space-y-3">
                  {[
                    'Data lineage tracking implemented',
                    'Data classification system in place',
                    'PII identification and protection',
                    'Data retention policies defined',
                    'Data access controls and monitoring',
                    'Regular data quality assessments'
                  ].map((governance) => (
                    <label key={governance} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{governance}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">High-Value Datasets for AI</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe your key datasets that could benefit from AI analysis (customer data, transaction logs, sensor data, etc.)"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Architecture & MLOps</h2>
            <p className="text-muted-foreground">
              Evaluate your technical infrastructure and operational capabilities for AI/ML workloads.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Cloud & Infrastructure</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Multi-cloud setup',
                    'On-premises infrastructure', 'Hybrid cloud', 'Kubernetes/Containers', 'Serverless functions'
                  ].map((cloud) => (
                    <label key={cloud} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{cloud}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">MLOps Tools & Practices</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Model Registry (MLflow, SageMaker)', 'CI/CD for ML (GitHub Actions, GitLab)',
                    'Model Monitoring & Drift Detection', 'A/B Testing for Models',
                    'Automated Model Training', 'Model Versioning & Rollback',
                    'Feature Engineering Pipelines', 'Model Performance Tracking'
                  ].map((mlops) => (
                    <label key={mlops} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{mlops}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Development Maturity</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select maturity level...</option>
                    <option>Manual processes, ad-hoc deployments</option>
                    <option>Basic CI/CD, some automation</option>
                    <option>Structured MLOps, monitoring in place</option>
                    <option>Advanced MLOps, full automation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Observability</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Rate your observability...</option>
                    <option>Comprehensive - Logs, metrics, traces</option>
                    <option>Good - Basic monitoring in place</option>
                    <option>Limited - Minimal visibility</option>
                    <option>Poor - Little to no monitoring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">AI/ML Architecture Challenges</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe any technical challenges or bottlenecks in your current AI/ML infrastructure..."
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Governance, Risk & Compliance</h2>
            <p className="text-muted-foreground">
              Assess your compliance posture and risk management for AI implementations.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">GDPR Compliance (EU/EEA)</label>
                <div className="space-y-3">
                  {[
                    'Data Protection Impact Assessments (DPIA) conducted for AI',
                    'Data Processing Agreements (DPA) with AI vendors',
                    'Lawful basis established for AI data processing',
                    'Data subject rights process (access, rectification, erasure)',
                    'Privacy by design principles applied',
                    'Records of processing activities maintained'
                  ].map((gdpr) => (
                    <label key={gdpr} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{gdpr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">AI Governance Framework</label>
                <div className="space-y-3">
                  {[
                    'AI Ethics Committee or Review Board established',
                    'AI risk assessment process defined',
                    'Model cards and documentation standards',
                    'Human oversight requirements defined',
                    'Bias testing and fairness evaluation',
                    'Transparency and explainability requirements'
                  ].map((governance) => (
                    <label key={governance} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{governance}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">EU AI Act Readiness</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select readiness level...</option>
                    <option>Fully compliant and documented</option>
                    <option>Aware and preparing for compliance</option>
                    <option>Basic awareness, limited preparation</option>
                    <option>No specific preparation yet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ISO 27001 Status</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select certification status...</option>
                    <option>Certified and maintained</option>
                    <option>Implementation in progress</option>
                    <option>Planning to implement</option>
                    <option>Not applicable/No plans</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vendor Risk Management</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe your process for evaluating and managing risks from AI vendors and service providers..."
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Security & Privacy</h2>
            <p className="text-muted-foreground">
              Evaluate your security measures and privacy protections for AI systems.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Data Security Measures</label>
                <div className="space-y-3">
                  {[
                    'Encryption at rest for all data stores',
                    'Encryption in transit (TLS/SSL)',
                    'Data tokenization or pseudonymization',
                    'Secure key management (KMS/Vault)',
                    'Regular key rotation policies',
                    'Data loss prevention (DLP) tools'
                  ].map((security) => (
                    <label key={security} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{security}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Access Controls & Authentication</label>
                <div className="space-y-3">
                  {[
                    'Multi-factor authentication (MFA) enforced',
                    'Role-based access control (RBAC)',
                    'Principle of least privilege applied',
                    'Regular access reviews and audits',
                    'Single Sign-On (SSO) implementation',
                    'Privileged access management (PAM)'
                  ].map((access) => (
                    <label key={access} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{access}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Security Incident Response</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select incident response maturity...</option>
                    <option>Comprehensive IR plan with AI scenarios</option>
                    <option>General IR plan, some AI considerations</option>
                    <option>Basic IR plan, no AI-specific procedures</option>
                    <option>No formal incident response plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Privacy Protection Level</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Rate privacy protection...</option>
                    <option>Advanced - Comprehensive privacy controls</option>
                    <option>Good - Standard privacy measures</option>
                    <option>Basic - Minimal privacy protections</option>
                    <option>Inadequate - Limited privacy controls</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">AI-Specific Security Concerns</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe any specific security concerns or requirements for your AI implementations (prompt injection, model theft, data poisoning, etc.)"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">People & Skills</h2>
            <p className="text-muted-foreground">
              Assess your team's AI capabilities and identify skill development needs.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Current AI/ML Roles</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Data Scientists', 'ML Engineers', 'Data Engineers', 'MLOps Engineers',
                    'AI Product Managers', 'Data Stewards', 'AI Ethics Officers', 'AI Researchers'
                  ].map((role) => (
                    <div key={role} className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm flex-1">{role}</span>
                      <input 
                        type="number" 
                        className="w-16 p-1 border border-border rounded text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">AI Skill Level (Overall)</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Rate overall AI skills...</option>
                    <option>Expert - Advanced AI capabilities</option>
                    <option>Intermediate - Good foundation</option>
                    <option>Beginner - Basic understanding</option>
                    <option>Minimal - Limited AI knowledge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Training Investment</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select training commitment...</option>
                    <option>High - Regular training programs</option>
                    <option>Medium - Occasional training</option>
                    <option>Low - Minimal training budget</option>
                    <option>None - No dedicated AI training</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Training & Development Priorities</label>
                <div className="space-y-3">
                  {[
                    'Prompt engineering and AI tool usage',
                    'Machine learning fundamentals',
                    'AI ethics and responsible AI practices',
                    'Data science and analytics',
                    'MLOps and model deployment',
                    'AI governance and compliance'
                  ].map((training) => (
                    <label key={training} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{training}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Skill Gaps & Hiring Plans</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe critical skill gaps and any plans for hiring or upskilling in AI-related roles..."
                />
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Delivery & Change Management</h2>
            <p className="text-muted-foreground">
              Evaluate your processes for delivering AI projects and managing organizational change.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">AI Project Delivery Framework</label>
                <div className="space-y-3">
                  {[
                    'Structured discovery and feasibility assessment',
                    'Pilot project methodology defined',
                    'Stage gates for production deployment',
                    'Success criteria and KPI definition',
                    'Risk mitigation planning',
                    'Stakeholder engagement process'
                  ].map((delivery) => (
                    <label key={delivery} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{delivery}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Change Management Maturity</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select change management level...</option>
                    <option>Advanced - Comprehensive change program</option>
                    <option>Structured - Formal processes in place</option>
                    <option>Ad-hoc - Informal change management</option>
                    <option>Minimal - Limited change support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">User Adoption Success</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Rate adoption success...</option>
                    <option>Excellent - High engagement rates</option>
                    <option>Good - Steady adoption progress</option>
                    <option>Mixed - Varied adoption across groups</option>
                    <option>Challenging - Low adoption rates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Communication & Training</label>
                <div className="space-y-3">
                  {[
                    'Regular AI awareness sessions',
                    'Executive sponsorship and communication',
                    'Department champion network',
                    'Success story sharing',
                    'Feedback collection and response',
                    'Continuous improvement process'
                  ].map((communication) => (
                    <label key={communication} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{communication}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Implementation Challenges</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe key challenges in implementing AI projects and driving adoption (cultural resistance, technical barriers, resource constraints, etc.)"
                />
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Business Impact & ROI</h2>
            <p className="text-muted-foreground">
              Assess how you measure and track the business value of AI investments.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Value Measurement Approach</label>
                <div className="space-y-3">
                  {[
                    'KPIs defined and tracked for AI initiatives',
                    'Baseline metrics established pre-AI',
                    'Regular ROI assessments conducted',
                    'Time savings quantified and tracked',
                    'Quality improvements measured',
                    'Revenue impact attribution methods'
                  ].map((measurement) => (
                    <label key={measurement} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-sm">{measurement}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Current ROI Tracking</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select ROI tracking maturity...</option>
                    <option>Comprehensive - Detailed ROI analysis</option>
                    <option>Good - Regular ROI monitoring</option>
                    <option>Basic - Occasional ROI assessment</option>
                    <option>None - No formal ROI tracking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payback Period Expectation</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Expected payback timeline...</option>
                    <option>0-6 months</option>
                    <option>6-12 months</option>
                    <option>12-24 months</option>
                    <option>24+ months</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Annual AI Budget</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Select budget range...</option>
                    <option>Under €50K</option>
                    <option>€50K - €200K</option>
                    <option>€200K - €500K</option>
                    <option>€500K - €1M</option>
                    <option>Over €1M</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Budget Allocation</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Primary budget focus...</option>
                    <option>Tools & Software</option>
                    <option>Personnel & Training</option>
                    <option>Infrastructure</option>
                    <option>External Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Success Metrics Priority</label>
                  <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Top success metric...</option>
                    <option>Cost Reduction</option>
                    <option>Time Savings</option>
                    <option>Quality Improvement</option>
                    <option>Revenue Growth</option>
                    <option>Innovation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Business Outcomes & Challenges</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Describe the most important business outcomes you expect from AI, and any challenges in measuring or achieving ROI..."
                />
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Summary & Audit Generation</h2>
            <p className="text-muted-foreground">
              Review your responses and generate your comprehensive AI audit report.
            </p>

            <div className="space-y-6">
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="text-lg font-semibold mb-4">Audit Completion Summary</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Sections Completed</h4>
                    <div className="space-y-1">
                      {steps.slice(0, 9).map((step) => (
                        <div key={step.id} className="flex items-center space-x-2">
                          {step.completed ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">What's Included</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Executive Summary</li>
                      <li>• AI Maturity Assessment</li>
                      <li>• Gap Analysis & Recommendations</li>
                      <li>• Risk Assessment</li>
                      <li>• 90-Day Action Plan</li>
                      <li>• ROI Projections</li>
                      <li>• Compliance Roadmap</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium mb-3">Report Preferences</label>
                <div className="space-y-3">
                  {[
                    'Include detailed technical recommendations',
                    'Focus on compliance and governance priorities',
                    'Emphasize quick wins and low-effort improvements',
                    'Include vendor-specific guidance',
                    'Add industry benchmarking context',
                    'Include templates and checklists'
                  ].map((preference) => (
                    <label key={preference} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" defaultChecked />
                      <span className="text-sm">{preference}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Context or Priorities</label>
                <textarea 
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24"
                  placeholder="Any additional context about your organization's priorities, constraints, or specific areas of focus for the audit recommendations..."
                />
              </div>

              <Card className="p-6 bg-muted/30 border-dashed">
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Ready to Generate Your Audit</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your responses will be analyzed to create a personalized AI audit report with actionable recommendations.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Report generation typically takes 2-3 minutes. You'll receive a PDF download and email copy.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Step {currentStep}</h2>
            <p className="text-muted-foreground">
              {steps.find(s => s.id === currentStep)?.description}
            </p>
            <div className="bg-muted/30 border border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                This step is under development. Content will be available soon.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <AuditProgress 
              currentStep={currentStep}
              totalSteps={auditSteps.length}
              steps={steps}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="card-gradient p-8">
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="btn-ghost-pro"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <AutoSaveStatus isAutoSaving={isAutoSaving} auditId={auditId} />
                  
                  {selectedText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFormAssistant(true)}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Ask AI about: "{selectedText.substring(0, 20)}..."
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary-dark"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : currentStep === auditSteps.length ? (
                    <>
                      Generate Audit
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <AuditReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportContent={reportContent}
        isGenerating={isGenerating}
        auditId={auditId}
      />
      
      <FormAssistant
        isOpen={showFormAssistant}
        onClose={() => {
          setShowFormAssistant(false);
          setSelectedText('');
        }}
        selectedText={selectedText}
        context={`AI Audit Form - Step ${currentStep}: ${steps.find(s => s.id === currentStep)?.title}`}
      />
    </div>
  );
}