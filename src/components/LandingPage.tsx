import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Brain, Calendar, Facebook, Instagram, TwitterIcon as X, Linkedin, Youtube, Sparkles, Shield, Clock, RotateCcw } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.jpg";
import featureLibrary from "@/assets/feature-library.jpg";
import featureAI from "@/assets/feature-ai.jpg";
import featureSchedule from "@/assets/feature-schedule.jpg";
import featurePlatforms from "@/assets/feature-platforms.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">AutoPostr</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={scrollToFeatures} className="text-muted-foreground hover:text-foreground transition-smooth">
            Features
          </button>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
            Pricing
          </a>
          <a href="#support" className="text-muted-foreground hover:text-foreground transition-smooth">
            Support
          </a>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
          <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Social Media
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Post like a{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  pro
                </span>
                —automatically.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                AutoPostr writes captions, schedules posts, and rotates your library—so you don't need a social media manager.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group" onClick={() => navigate("/auth")}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={scrollToFeatures}>
                See How It Works
              </Button>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src={heroIllustration} 
              alt="AutoPostr dashboard showing automated social media posting" 
              className="w-full h-auto rounded-2xl shadow-strong animate-float"
            />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to automate social media</h2>
            <p className="text-xl text-muted-foreground">Perfect for local businesses who want professional results without the complexity</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-smooth group">
              <CardContent className="p-6 space-y-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={featureLibrary} alt="Content library feature" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold">Upload once, post forever</h3>
                <p className="text-muted-foreground">Content library with random rotation keeps your feed fresh without constant uploads.</p>
                <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <Upload className="w-4 h-4 mr-2" />
                  Smart rotation
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth group">
              <CardContent className="p-6 space-y-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={featureAI} alt="AI caption generation feature" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold">AI captions from your brand</h3>
                <p className="text-muted-foreground">Analyzes your images and menu to write engaging captions that match your voice.</p>
                <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <Brain className="w-4 h-4 mr-2" />
                  Smart writing
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth group">
              <CardContent className="p-6 space-y-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={featureSchedule} alt="Unlimited scheduling feature" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold">Unlimited schedules</h3>
                <p className="text-muted-foreground">Set your posting times and let AutoPostr handle the rest. Post multiple times daily.</p>
                <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <Calendar className="w-4 h-4 mr-2" />
                  Auto posting
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth group">
              <CardContent className="p-6 space-y-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={featurePlatforms} alt="Platform integrations feature" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold">Works with Facebook & Instagram</h3>
                <p className="text-muted-foreground">Direct integration with your business accounts. More platforms coming soon.</p>
                <div className="flex items-center space-x-2">
                  <Facebook className="w-4 h-4 text-[#1877f2]" />
                  <Instagram className="w-4 h-4 text-[#E4405F]" />
                  <Badge variant="outline" className="text-xs">+More Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Supported platforms</h2>
            <p className="text-xl text-muted-foreground">Start with the most popular platforms, with more coming soon</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="shadow-soft">
              <CardContent className="p-6 flex items-center space-x-4">
                <Facebook className="w-8 h-8 text-[#1877f2]" />
                <div>
                  <h3 className="font-semibold">Facebook Pages</h3>
                  <p className="text-sm text-muted-foreground">Business pages & insights</p>
                </div>
                <Badge variant="success" className="ml-auto">Active</Badge>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6 flex items-center space-x-4">
                <Instagram className="w-8 h-8 text-[#E4405F]" />
                <div>
                  <h3 className="font-semibold">Instagram Business</h3>
                  <p className="text-sm text-muted-foreground">Posts & stories</p>
                </div>
                <Badge variant="success" className="ml-auto">Active</Badge>
              </CardContent>
            </Card>

            <Card className="shadow-soft opacity-60">
              <CardContent className="p-6 flex items-center space-x-4">
                <X className="w-8 h-8 text-foreground" />
                <div>
                  <h3 className="font-semibold">X (Twitter)</h3>
                  <p className="text-sm text-muted-foreground">Posts & threads</p>
                </div>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </CardContent>
            </Card>

            <Card className="shadow-soft opacity-60">
              <CardContent className="p-6 flex items-center space-x-4">
                <Linkedin className="w-8 h-8 text-[#0077b5]" />
                <div>
                  <h3 className="font-semibold">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">Company pages</p>
                </div>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </CardContent>
            </Card>

            <Card className="shadow-soft opacity-60">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="w-8 h-8 bg-[#FF0000] rounded flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">YouTube</h3>
                  <p className="text-sm text-muted-foreground">Video uploads</p>
                </div>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </CardContent>
            </Card>

            <Card className="shadow-soft opacity-60">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#ff0050] to-[#00f2ea] rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div>
                  <h3 className="font-semibold">TikTok</h3>
                  <p className="text-sm text-muted-foreground">Short videos</p>
                </div>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">You stay in control</h2>
          <p className="text-xl text-muted-foreground">Your accounts, your content, your rules. We never post without your permission.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Shield className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Secure Permissions</h3>
              <p className="text-sm text-muted-foreground">Revoke access anytime directly from your social accounts</p>
            </div>
            <div className="space-y-3">
              <Clock className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Your Schedule</h3>
              <p className="text-sm text-muted-foreground">Posts only when you want, at times you set</p>
            </div>
            <div className="space-y-3">
              <RotateCcw className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">Always Reversible</h3>
              <p className="text-sm text-muted-foreground">Stop automation or delete posts anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to automate your social media?</h2>
          <p className="text-xl text-muted-foreground">Join hundreds of local businesses already saving time with AutoPostr</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="group" onClick={() => navigate("/auth")}>
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required • Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AutoPostr</span>
              </div>
              <p className="text-muted-foreground">Made for local businesses who want to post like pros.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-smooth">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-smooth">Pricing</a></li>
                <li><a href="#integrations" className="hover:text-foreground transition-smooth">Integrations</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#help" className="hover:text-foreground transition-smooth">Help Center</a></li>
                <li><a href="#contact" className="hover:text-foreground transition-smooth">Contact Us</a></li>
                <li><a href="mailto:support@autopostr.com" className="hover:text-foreground transition-smooth">support@autopostr.com</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#privacy" className="hover:text-foreground transition-smooth">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-foreground transition-smooth">Terms of Service</a></li>
                <li><a href="#security" className="hover:text-foreground transition-smooth">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AutoPostr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;