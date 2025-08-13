import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  CheckCircle,
  XCircle,
  Users,
  Zap,
  Loader2,
  Settings
} from "lucide-react";

interface Connection {
  id: string;
  name: string;
  platform: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  enabled: boolean;
  description: string;
  color: string;
  pages?: Array<{ pageId: string; pageName: string; permissions: string[] }>;
}

interface SocialConnection {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  permissions: string[];
}

export default function Connections() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "facebook",
      name: "Facebook",
      platform: "facebook",
      icon: Facebook,
      connected: false,
      enabled: true,
      description: "Post to your Facebook pages",
      color: "hsl(221, 44%, 41%)"
    },
    {
      id: "twitter",
      name: "Twitter / X",
      platform: "twitter",
      icon: Twitter,
      connected: false,
      enabled: true,
      description: "Share your content on Twitter/X",
      color: "hsl(200, 50%, 50%)"
    },
    {
      id: "instagram",
      name: "Instagram",
      platform: "instagram",
      icon: Instagram,
      connected: false,
      enabled: true,
      description: "Share photos and stories",
      color: "hsl(320, 70%, 50%)"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      platform: "linkedin",
      icon: Linkedin,
      connected: false,
      enabled: true,
      description: "Connect with professionals",
      color: "hsl(201, 100%, 35%)"
    },
    {
      id: "youtube",
      name: "YouTube",
      platform: "youtube",
      icon: Youtube,
      connected: false,
      enabled: true,
      description: "Upload and share videos",
      color: "hsl(0, 100%, 50%)"
    }
  ]);
  
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Load social connections from database and handle OAuth returns
  useEffect(() => {
    if (user) {
      loadSocialConnections();
      // Check if we just returned from OAuth and fetch pages
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('provider') === 'facebook') {
        fetchFacebookPages();
      }
    }
  }, [user]);

  const loadSocialConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      setSocialConnections(data || []);
      
      // Update connections state based on database data
      setConnections(prev => prev.map(conn => {
        const dbConnections = data?.filter(sc => sc.platform === conn.platform) || [];
        const isConnected = dbConnections.length > 0;
        const pages = dbConnections.map(sc => ({
          pageId: sc.page_id,
          pageName: sc.page_name,
          permissions: sc.permissions || []
        }));

        return {
          ...conn,
          connected: isConnected,
          pages: pages
        };
      }));
    } catch (error) {
      console.error('Error loading social connections:', error);
      toast({
        title: "Error",
        description: "Failed to load social connections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setConnecting(null);
    }
  };

  const fetchFacebookPages = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await supabase.functions.invoke('facebook-pages', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      await loadSocialConnections();
      
      toast({
        title: "Connected to Facebook",
        description: `Successfully connected ${response.data.pages?.length || 0} Facebook pages.`,
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/app/connections');
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      toast({
        title: "Connection Error",
        description: "Connected to Facebook but failed to fetch pages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !session?.access_token) return;

    if (connection.platform === 'facebook') {
      if (connection.connected) {
        // Disconnect - remove all Facebook page connections
        await handleDisconnect(connectionId);
      } else {
        // Connect - start Facebook OAuth flow
        await handleFacebookConnect();
      }
    } else {
      // For other platforms, show coming soon message
      toast({
        title: "Coming Soon",
        description: `${connection.name} integration is coming soon!`,
      });
    }
  };

  const handleFacebookConnect = async () => {
    setConnecting('facebook');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/app/connections`,
          scopes: [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_manage_posts',
            'pages_manage_metadata',
            'pages_read_engagement',
            'pages_read_user_content'
          ].join(',')
        }
      });

      if (error) throw error;
      
      // OAuth will redirect, so we don't need to handle the response here
    } catch (error) {
      console.error('Facebook connect error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to start Facebook connection",
        variant: "destructive",
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    try {
      // Remove all connections for this platform
      const { error } = await supabase
        .from('social_connections')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .eq('platform', connection.platform);

      if (error) throw error;

      await loadSocialConnections();
      
      toast({
        title: "Disconnected",
        description: `${connection.name} has been disconnected.`,
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect platform",
        variant: "destructive",
      });
    }
  };

  const handleToggleEnabled = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, enabled: !conn.enabled }
          : conn
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to start automating your posts
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => {
          const Icon = connection.icon;
          return (
            <Card key={connection.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${connection.color}15`, color: connection.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {connection.connected ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">
                  {connection.description}
                </CardDescription>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleConnect(connection.id)}
                    variant={connection.connected ? "destructive" : "default"}
                    className="w-full"
                    disabled={connecting === connection.platform}
                  >
                    {connecting === connection.platform ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      connection.connected ? "Disconnect" : "Connect"
                    )}
                  </Button>
                  
                  {connection.connected && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-posting</span>
                      <Switch
                        checked={connection.enabled}
                        onCheckedChange={() => handleToggleEnabled(connection.id)}
                      />
                    </div>
                  )}
                </div>

                {/* Show connected pages for Facebook */}
                {connection.platform === 'facebook' && connection.connected && connection.pages && connection.pages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Connected Pages:</h4>
                    <div className="space-y-2">
                      {connection.pages.map((page) => (
                        <div key={page.pageId} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{page.pageName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {page.permissions.includes('CREATE_CONTENT') ? 'Can Post' : 'Connected'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Connection Summary</span>
          </CardTitle>
          <CardDescription>
            Overview of your connected platforms and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {connections.filter(c => c.connected).length}
              </div>
              <div className="text-sm text-muted-foreground">Connected Platforms</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">
                {connections.filter(c => c.connected && c.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Auto-posting</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}