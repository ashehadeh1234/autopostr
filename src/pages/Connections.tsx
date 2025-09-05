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


  const handleConnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    if (connection.platform === 'facebook') {
      try {
        setConnectingPlatform('facebook');
        
        // Get Facebook authorization URL
        const { data, error } = await supabase.functions.invoke('facebook-authorize');
        
        if (error || !data?.authUrl) {
          console.error('Facebook authorize error:', error);
          toast({
            title: "Connection Failed",
            description: "Failed to initialize Facebook connection. Please try again.",
            variant: "destructive"
          });
          return;
        }

        // Redirect to Facebook OAuth
        window.location.href = data.authUrl;
        
      } catch (error) {
        console.error('Facebook connection error:', error);
        toast({
          title: "Connection Failed",
          description: "An error occurred while connecting to Facebook.",
          variant: "destructive"
        });
        setConnectingPlatform(null);
      }
    } else {
      toast({
        title: "Coming Soon",
        description: `${connection.name} integration is coming soon!`,
      });
    }
  };

  // Handle Facebook callback success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCallback = urlParams.get('fb_callback');
    const pages = urlParams.get('pages');

    if (isCallback === 'success') {
      toast({
        title: "Facebook Connected!",
        description: `Successfully connected to Facebook${pages ? ` with ${pages} page(s)` : ''}.`,
      });
      
      // Reload connections to reflect the new connection
      loadSocialConnections();
      
      // Clean up URL
      window.history.replaceState({}, '', '/app/connections');
    }
  }, [toast, loadSocialConnections]);


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