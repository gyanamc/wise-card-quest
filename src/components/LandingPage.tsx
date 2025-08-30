import { CreditCard, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export const LandingPage = () => {
  const { signInWithGoogle } = useAuth();

  const features = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Smart Recommendations",
      description: "Get personalized credit card suggestions based on your spending habits and goals."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "No Personal Info Required",
      description: "No phone numbers, no pushy sales tactics - just honest, AI-powered advice."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Agentic AI Advisor",
      description: "Our AI asks the right questions to understand your unique financial situation."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Analysis",
      description: "Compare rewards, fees, and benefits instantly with AI-powered insights."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI Credit Card Advisor
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find the perfect credit card using Agentic AI. No phone numbers required. 
            No push for random credit cards—get personalized recommendations based on your needs.
          </p>
          <Button 
            onClick={signInWithGoogle}
            size="lg"
            className="text-lg px-8 py-6 h-auto"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Sign In Securely</h3>
              <p className="text-muted-foreground">
                Quick Google sign-in to access your personalized chat interface.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Chat with AI</h3>
              <p className="text-muted-foreground">
                Tell our AI about your spending habits, credit goals, and preferences.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Get Recommendations</h3>
              <p className="text-muted-foreground">
                Receive ranked, personalized credit card recommendations with detailed comparisons.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
            <Shield className="h-5 w-5" />
            <span>Your privacy is our priority</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            We never share your personal information with credit card companies. 
            Our AI provides unbiased recommendations based solely on your needs and preferences.
          </p>
        </div>
      </div>
    </div>
  );
};