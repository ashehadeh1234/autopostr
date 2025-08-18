import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { errorHandler } from "@/utils/errorHandling";
import { connectionManager } from "@/utils/connectionUtils";
import { DebugPanel } from "@/components/DebugPanel";
import { DebugConsole } from "@/components/DebugConsole";
import { useLogger } from "@/hooks/useLogger";
import { logger } from "@/utils/logger";
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
  Settings,
  Bug,
  AlertCircle,
  Terminal
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
  const { logUserAction, logApiCall, logApiResponse, logError, logInfo } = useLogger('Connections');
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isDebugConsoleOpen, setIsDebugConsoleOpen] = useState(false);
  const [connectionErrors, setConnectionErrors] = useState<Record<string, string>>({});

  // Load social connections from database
  useEffect(() => {
    logInfo('Component mounted', { userId: user?.id });
    if (user) {
      logInfo('Loading social connections for user');
      loadSocialConnections();
    }
  }, [user]);

  const loadSocialConnections = async () => {
    return connectionManager.withRetry(async () => {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      setSocialConnections(data || []);
      
      // Clear any previous connection errors for successful load
      setConnectionErrors({});
      
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
      
      setIsLoading(false);
    }, { maxAttempts: 2 }, { operation: 'loadSocialConnections', userId: user?.id }).catch((error) => {
      const errorId = errorHandler.log(error, { operation: 'loadSocialConnections', userId: user?.id }, user?.id);
      errorHandler.showUserFriendlyError(errorId);
      setIsLoading(false);
    });
  };

  const handleConnect = async (connectionId: string) => {
    logUserAction('click', 'connect-button', { connectionId });
    const connection = connections.find(c => c.id === connectionId);
    
    if (!connection || !session?.access_token) {
      logError('Connect failed: missing connection or session', { connectionId, hasConnection: !!connection, hasSession: !!session?.access_token });
      return;
    }

    logInfo('Starting connection process', { platform: connection.platform, connected: connection.connected });

    if (connection.platform === 'facebook') {
      if (connection.connected) {
        logInfo('Disconnecting Facebook');
        await handleDisconnect(connectionId);
      } else {
        logInfo('Starting Facebook OAuth flow');
        await handleFacebookConnect();
      }
    } else {
      logInfo('Platform not yet supported', { platform: connection.platform });
      toast({
        title: "Coming Soon",
        description: `${connection.name} integration is coming soon!`,
      });
    }
  };

  const handleFacebookConnect = async () => {
    if (!session?.access_token) {
      logError('Facebook connect failed: no session token');
      return;
    }
    
    logger.connectionStart('facebook', user?.id);
    setConnecting('facebook');
    setConnectionErrors(prev => ({ ...prev, facebook: '' }));
    
    return connectionManager.withRetry(async () => {
      logApiCall('POST', 'facebook-oauth:getAuthUrl');
      const response = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'getAuthUrl' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      logApiResponse('POST', 'facebook-oauth:getAuthUrl', response.error ? 400 : 200, response);

      if (response.error) {
        logError('Failed to get Facebook auth URL', response.error);
        throw new Error(response.error.message || 'Failed to get Facebook auth URL');
      }

      logInfo('Opening Facebook OAuth window', { authUrl: response.data.authUrl });
      const authWindow = window.open(response.data.authUrl, 'facebook-oauth', 'width=600,height=600');
      
      if (!authWindow) {
        logError('Failed to open popup window');
        throw new Error('Failed to open authentication window. Please allow popups for this site.');
      }
      
      logInfo('Popup window opened, waiting for OAuth completion');
      
      // Listen for OAuth completion with timeout
      const handleMessage = async (event: MessageEvent) => {
        logInfo('Received window message', { type: event.data.type, origin: event.origin });
        
        if (event.origin !== window.location.origin) {
          logInfo('Message ignored: invalid origin', { received: event.origin, expected: window.location.origin });
          return;
        }
        
        if (event.data.type === 'FACEBOOK_OAUTH_CODE') {
          logInfo('Processing OAuth code', { code: event.data.code?.slice(0, 10) + '...' });
          try {
            const callbackResponse = await connectionManager.withRetry(async () => {
              logApiCall('POST', 'facebook-oauth:handleCallback', { code: event.data.code?.slice(0, 10) + '...' });
              const result = await supabase.functions.invoke('facebook-oauth', {
                body: { 
                  action: 'handleCallback',
                  code: event.data.code,
                  state: event.data.state
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`
                }
              });

              logApiResponse('POST', 'facebook-oauth:handleCallback', result.error ? 400 : 200, result);

              if (result.error) {
                logError('Callback processing failed', result.error);
                throw new Error(result.error.message || 'Callback processing failed');
              }
              return result;
            }, { maxAttempts: 2 }, { 
              operation: 'facebookCallback', 
              code: event.data.code?.slice(0, 10) + '...',
              userId: user?.id 
            });

            logInfo('Facebook callback successful', { pages: callbackResponse.data.pages?.length });
            logger.connectionSuccess('facebook', { pages: callbackResponse.data.pages?.length }, user?.id);
            
            await loadSocialConnections();
            toast({
              title: "Connected to Facebook",
              description: `Successfully connected ${callbackResponse.data.pages?.length || 0} Facebook pages.`,
            });
          } catch (error) {
            logError('Facebook callback error', error);
            logger.connectionError('facebook', error, user?.id);
            
            const errorId = errorHandler.log(error as Error, { 
              operation: 'facebookCallback',
              userId: user?.id,
              code: event.data.code?.slice(0, 10) + '...'
            }, user?.id);
            errorHandler.showUserFriendlyError(errorId, 'Failed to process Facebook connection. Please try again.');
            setConnectionErrors(prev => ({ ...prev, facebook: (error as Error).message }));
          }
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
          const errorMsg = event.data.error || "Failed to connect to Facebook";
          const errorId = errorHandler.log(new Error(errorMsg), { 
            operation: 'facebookOAuth',
            errorType: 'oauth_error',
            userId: user?.id 
          }, user?.id);
          errorHandler.showUserFriendlyError(errorId);
          setConnectionErrors(prev => ({ ...prev, facebook: errorMsg }));
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Set timeout for OAuth process
      setTimeout(() => {
        if (connecting === 'facebook') {
          window.removeEventListener('message', handleMessage);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          setConnecting(null);
          setConnectionErrors(prev => ({ ...prev, facebook: 'Authentication timed out. Please try again.' }));
        }
      }, 300000); // 5 minute timeout
      
    }, { maxAttempts: 2 }, { 
      operation: 'facebookConnect', 
      userId: user?.id 
    }).catch((error) => {
      const errorId = errorHandler.log(error, { operation: 'facebookConnect', userId: user?.id }, user?.id);
      errorHandler.showUserFriendlyError(errorId, 'Failed to start Facebook connection. Please try again.');
      setConnectionErrors(prev => ({ ...prev, facebook: error.message }));
      setConnecting(null);
    });
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
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDebugConsoleOpen(true)}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDebugOpen(true)}
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
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

                {/* Show connection error if any */}
                {connectionErrors[connection.platform] && (
                  <div className="mt-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-destructive">
                        {connectionErrors[connection.platform]}
                      </div>
                    </div>
                  </div>
                )}

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

      <DebugPanel 
        isOpen={isDebugOpen} 
        onClose={() => setIsDebugOpen(false)} 
      />
      
      {isDebugConsoleOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Debug Console</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDebugConsoleOpen(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <DebugConsole />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}