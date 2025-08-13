import { CheckCircle, Circle, ExternalLink, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";

const Setup = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const projectRef = "wpobzmfjkxffnpddisrc";
  const redirectUri = `https://${projectRef}.supabase.co/auth/v1/callback`;

  const setupSteps = [
    {
      id: "supabase-facebook-provider",
      title: "Enable Facebook Provider in Supabase",
      description: "Enable Facebook authentication in your Supabase project",
      completed: false,
      urgent: true,
      content: (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required:</strong> Facebook provider must be enabled in Supabase before OAuth will work.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Go to Supabase Dashboard → Authentication → Providers</p>
            <p className="text-sm font-medium">2. Find "Facebook" and click to configure it</p>
            <p className="text-sm font-medium">3. Toggle "Enable sign in with Facebook" to ON</p>
            <p className="text-sm font-medium">4. Add your Facebook App credentials:</p>
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                <span className="text-muted-foreground">Facebook App ID:</span>
                <code className="flex-1">Your Facebook App ID</code>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                <span className="text-muted-foreground">Facebook App Secret:</span>
                <code className="flex-1">Your Facebook App Secret</code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Get these from Meta for Developers → Your App → Settings → Basic
            </p>
          </div>

          <Button asChild variant="outline">
            <a 
              href={`https://supabase.com/dashboard/project/${projectRef}/auth/providers`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open Supabase Auth Providers <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )
    },
    {
      id: "facebook-oauth",
      title: "Facebook OAuth Configuration",
      description: "Configure your Facebook App's OAuth redirect URI",
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Go to Meta for Developers → Your App → Facebook Login → Settings</p>
            <p className="text-sm font-medium">2. Add this exact URL to "Valid OAuth Redirect URIs":</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <code className="flex-1">{redirectUri}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(redirectUri, "redirect-uri")}
              >
                {copiedItem === "redirect-uri" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Remove any URLs pointing to /functions/... - they cause errors
            </p>
          </div>

          <Button asChild variant="outline">
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
              Open Meta for Developers <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )
    },
    {
      id: "supabase-urls",
      title: "Supabase URL Configuration",
      description: "Configure Supabase Auth URLs for your deployment",
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Go to Supabase Dashboard → Authentication → URL Configuration</p>
            <p className="text-sm font-medium">2. Set Site URL to your app's URL:</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <code className="flex-1">http://localhost:3000</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("http://localhost:3000", "site-url")}
              >
                {copiedItem === "site-url" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              For production, use your deployed domain (e.g., yourdomain.com)
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">3. Add redirect URLs (comma-separated):</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <code className="flex-1">http://localhost:3000/**, https://yourapp.lovable.app/**</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("http://localhost:3000/**, https://yourapp.lovable.app/**", "redirect-urls")}
              >
                {copiedItem === "redirect-urls" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button asChild variant="outline">
            <a 
              href={`https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open Supabase Auth Settings <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )
    },
    {
      id: "facebook-permissions",
      title: "Facebook Permissions & Review",
      description: "Required permissions for posting and analytics",
      completed: false,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Required permissions for AutoPostr:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "pages_show_list",
                "pages_manage_posts", 
                "pages_manage_metadata",
                "pages_read_engagement",
                "pages_read_user_content",
                "pages_manage_engagement"
              ].map((permission) => (
                <Badge key={permission} variant="secondary" className="justify-start">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For production use, you'll need to submit your app for Facebook Review to use these permissions with any Facebook account.
            </AlertDescription>
          </Alert>

          <Button asChild variant="outline">
            <a href="https://developers.facebook.com/docs/app-review" target="_blank" rel="noopener noreferrer">
              Learn about App Review <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AutoPostr Setup</h1>
          <p className="text-muted-foreground">
            Complete these steps to get your social media automation running smoothly
          </p>
        </div>

        <div className="space-y-6">
          {setupSteps.map((step, index) => (
            <Card key={step.id} className={step.urgent ? "border-orange-200 bg-orange-50/50" : ""}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {index + 1}. {step.title}
                      </CardTitle>
                      {step.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {step.content}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Setup Complete?</h3>
          <p className="text-green-700 mb-4">
            Once you've completed these steps, try connecting your Facebook account in the Connections page.
          </p>
          <Button asChild>
            <a href="/app/connections">
              Go to Connections
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Setup;