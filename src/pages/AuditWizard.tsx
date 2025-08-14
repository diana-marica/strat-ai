import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuditProgress } from "@/components/AuditWizard/AuditProgress";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(auditSteps);

  const handleNext = () => {
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
    }
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
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
              />
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
                  
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Auto-saved
                  </Button>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentStep === auditSteps.length}
                  className="bg-primary hover:bg-primary-dark"
                >
                  {currentStep === auditSteps.length ? "Generate Audit" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}