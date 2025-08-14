import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Target, Zap } from "lucide-react";
import heroImage from "@/assets/hero-ai-audit.jpg";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-accent/20" />
      
      {/* Hero Image */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={heroImage} 
          alt="AI Audit Platform"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trusted by 500+ Organizations</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-text mb-6">
            From Zero to{" "}
            <span className="text-gradient">AI-Ready</span>
            <br />
            in Minutes
          </h1>

          {/* Subtitle */}
          <p className="subtitle-text max-w-3xl mx-auto mb-8">
            Comprehensive AI capability audit that evaluates your stack, policies, and operations. 
            Get a customized roadmap, governance guardrails, and actionable quick wins.
          </p>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">Instant Assessment</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">GDPR & EU AI Act Ready</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">90-Day Action Plan</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero group" asChild>
              <a href="/audit/new">
                Start Your Free Audit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="btn-ghost-pro">
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-sm text-muted-foreground">
            <p className="mb-4">Trusted by leading organizations worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="h-8 w-24 bg-muted rounded-md"></div>
              <div className="h-8 w-24 bg-muted rounded-md"></div>
              <div className="h-8 w-24 bg-muted rounded-md"></div>
              <div className="h-8 w-24 bg-muted rounded-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
    </section>
  );
}