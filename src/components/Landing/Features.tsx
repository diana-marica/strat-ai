import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Shield, 
  Zap, 
  FileCheck, 
  Users, 
  TrendingUp,
  Lock,
  Globe,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Comprehensive Assessment",
    description: "10-domain audit covering AI tooling, data landscape, MLOps, governance, and business impact",
    badge: "Core",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "GDPR foundations, EU AI Act readiness, ISO 27001 guidance with Romania-specific considerations",
    badge: "Compliance",
    color: "text-success"
  },
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    description: "Intelligent recommendations prioritized by impact, effort, and risk reduction using advanced AI",
    badge: "AI",
    color: "text-warning"
  },
  {
    icon: FileCheck,
    title: "Actionable Reports",
    description: "Executive summary, risk register, ROI estimates, and detailed 90-day implementation plan",
    badge: "Reports",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Multi-user access, role-based permissions, and seamless team workflow management",
    badge: "Teams",
    color: "text-success"
  },
  {
    icon: TrendingUp,
    title: "ROI Tracking",
    description: "Quantifiable business impact metrics with payback analysis and sensitivity modeling",
    badge: "Business",
    color: "text-warning"
  }
];

const benefits = [
  "Reduce audit time from weeks to hours",
  "Identify hidden AI risks and compliance gaps",
  "Prioritize initiatives with data-driven insights",
  "Accelerate AI adoption with confidence"
];

export function Features() {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Lock className="w-3 h-3 mr-1" />
            Enterprise-Grade Platform
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Complete AI Governance in One Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to assess, govern, and scale AI across your organization
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="card-gradient card-hover p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${feature.color.split('-')[1]}/10`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-soft">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Why Choose AI Audit Pro?
              </h3>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Globe className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Global Ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}