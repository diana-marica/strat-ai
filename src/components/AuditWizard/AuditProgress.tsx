import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";

interface AuditProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: number;
    title: string;
    description: string;
    completed: boolean;
  }>;
}

export function AuditProgress({ currentStep, totalSteps, steps }: AuditProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">Audit Progress</h3>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
        <Badge variant="secondary" className="font-medium">
          {Math.round(progressPercentage)}% Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progressPercentage} className="h-2 progress-glow" />
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.id === currentStep 
                ? 'bg-primary/5 border border-primary/20' 
                : step.completed 
                  ? 'bg-success/5' 
                  : 'hover:bg-muted/50'
            }`}
          >
            <div className="mt-0.5">
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : step.id === currentStep ? (
                <Circle className="w-5 h-5 text-primary fill-primary/20" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${
                step.id === currentStep ? 'text-primary' : 
                step.completed ? 'text-success' : 'text-foreground'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}