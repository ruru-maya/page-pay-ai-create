import { ArrowRight, Sparkles, Zap, Shield, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentPageGenerator from "@/components/PaymentPageGenerator";
import { useState } from "react";

const Index = () => {
  const [showGenerator, setShowGenerator] = useState(false);

  if (showGenerator) {
    return <PaymentPageGenerator />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Vivid AI Payments</span>
          </div>
          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
            AI-Powered
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              ✨ Revolutionary Payment Technology
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Create Perfect
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Payment Pages
              </span>
              in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your ideas into beautiful, high-converting payment experiences with AI. 
              No coding required, just describe what you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-vivid text-lg px-8 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                onClick={() => setShowGenerator(true)}
              >
                Start Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 rounded-xl font-semibold border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="bg-gradient-card border-0 shadow-elegant hover:shadow-vivid transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate professional payment pages in under 30 seconds with our advanced AI technology.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elegant hover:shadow-vivid transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Bank-Grade Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enterprise-level security with PCI DSS compliance and end-to-end encryption.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elegant hover:shadow-vivid transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Global Ready</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Accept payments worldwide with multi-currency support and localized experiences.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-20">
            <p className="text-muted-foreground mb-8">Trusted by innovative companies worldwide</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
              <span className="ml-2 font-semibold">4.9/5</span>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-card border-0 shadow-elegant">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    "This was the easiest payment setup ever! Our conversion rate increased by 40%."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">Sarah Chen</p>
                      <p className="text-xs text-muted-foreground">Startup Founder</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-elegant">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    "Incredible AI technology. We launched our payment system in minutes, not months."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-secondary rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">Marcus Webb</p>
                      <p className="text-xs text-muted-foreground">E-commerce Director</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-elegant">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    "The most beautiful payment pages I've ever seen. Our customers love the experience."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">Emma Rodriguez</p>
                      <p className="text-xs text-muted-foreground">Product Manager</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-primary border-0 shadow-vivid">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to transform your payments?
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Join thousands of businesses creating beautiful payment experiences with AI
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  onClick={() => setShowGenerator(true)}
                >
                  Start Building Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-primary border-t border-primary/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-medium">Powered by Vivid Money</span>
          </div>
        </div>
      </footer>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary rounded-full opacity-10 blur-3xl"></div>
      </div>
    </div>
  );
};

export default Index;