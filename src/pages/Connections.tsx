import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { ConnectionCard } from "@/components/ConnectionCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Connections() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  
  const {
    connections,
    isLoading,
    connectionErrors,
    handleToggleEnabled,
    loadSocialConnections
  } = useConnections();

  // Listen for auth changes and update connections when user logs in with OAuth
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'facebook') {
        // Create social connection record for Facebook
        try {
          const { error } = await supabase
            .from('social_connections')
            .upsert({
              user_id: session.user.id,
              platform: 'facebook',
              platform_user_id: session.user.user_metadata?.sub || session.user.id,
              platform_username: session.user.user_metadata?.name || session.user.email,
              is_active: true,
              permissions: ['public_profile', 'email']
            }, {
              onConflict: 'user_id,platform'
            });

          if (error) {
            console.error('Error creating Facebook connection:', error);
          } else {
            toast({
              title: "Facebook Connected!",
              description: "Your Facebook account has been connected successfully.",
            });
            // Reload connections to reflect the new status
            await loadSocialConnections();
          }
        } catch (error) {
          console.error('Error handling Facebook connection:', error);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, [toast, loadSocialConnections]);

  const handleConnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    if (connection.platform === 'facebook') {
      try {
        setConnectingPlatform('facebook');
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            scopes: 'public_profile,email',
            redirectTo: `${window.location.origin}/app/connections`
          }
        });

        if (error) {
          console.error('Facebook OAuth error:', error);
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Facebook. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Facebook connection error:', error);
        toast({
          title: "Connection Failed",
          description: "An error occurred while connecting to Facebook.",
          variant: "destructive"
        });
      } finally {
        setConnectingPlatform(null);
      }
    } else {
      toast({
        title: "Coming Soon",
        description: `${connection.name} integration is coming soon!`,
      });
    }
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
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            connecting={connectingPlatform === connection.platform}
            connectionError={connectionErrors[connection.platform]}
            onConnect={handleConnect}
            onToggleEnabled={handleToggleEnabled}
          />
        ))}
      </div>

      {connections.some(c => c.connected) && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Connection Summary</h3>
          <div className="text-sm text-muted-foreground">
            <p>
              Connected platforms: {connections.filter(c => c.connected).length} of {connections.length}
            </p>
            <p>
              Active for auto-posting: {connections.filter(c => c.connected && c.enabled).length}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}