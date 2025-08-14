import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

const plans = [
  {
    name: "Free Trial",
    price: "Free",
    period: "14 days",
    description: "Perfect for getting started",
    features: [
      "1 complete audit",
      "Basic recommendations",
      "PDF export with watermark",
      "Email support",
      "Community access"
    ],
    cta: "Start Free Trial",
    popular: false,
    badge: null
  },
  {
    name: "Professional",
    price: "€299",
    period: "per month",
    description: "For growing teams",
    features: [
      "Unlimited audits",
      "AI-powered recommendations",
      "Custom branded reports",
      "Team collaboration (5 users)",
      "Integration with Slack, Jira",
      "Priority support",
      "90-day action planning"
    ],
    cta: "Start Professional",
    popular: true,
    badge: "Most Popular"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per month",
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "SSO integration",
      "Custom audit templates",
      "On-premise deployment option",
      "Dedicated customer success",
      "Advanced analytics",
      "API access"
    ],
    cta: "Contact Sales",
    popular: false,
    badge: "Enterprise"
  }
];

export function Pricing() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your AI Governance Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. All plans include our core audit platform
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-6 ${
                plan.popular 
                  ? 'border-primary shadow-glow ring-1 ring-primary/20' 
                  : 'card-gradient'
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className={plan.popular ? "bg-primary" : "bg-secondary"}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'btn-hero' 
                    : 'btn-ghost-pro'
                }`}
                size="lg"
              >
                {plan.cta}
                {plan.popular && <Zap className="ml-2 w-4 h-4" />}
              </Button>
            </Card>
          ))}
        </div>

        {/* Trust Section */}
        <div className="text-center mt-16">
          <div className="bg-muted/50 rounded-lg p-6 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">500+</div>
                <div className="text-sm text-muted-foreground">Organizations Audited</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">€2.5M+</div>
                <div className="text-sm text-muted-foreground">Cost Savings Identified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">95%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}