import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { useFacebookOAuth } from "@/hooks/useFacebookOAuth";
import { ConnectionCard } from "@/components/ConnectionCard";
import { FacebookPageSelector } from "@/components/FacebookPageSelector";
import { logger } from "@/utils/logger";

export default function Connections() {
  const { toast } = useToast();
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<string>('');
  
  const {
    connections,
    isLoading,
    connectionErrors,
    loadSocialConnections,
    handleDisconnect,
    handleToggleEnabled,
    setConnectionError,
    clearConnectionError
  } = useConnections();
  
  const { connecting, handleFacebookConnect } = useFacebookOAuth();

  const handleConnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    logger.info(`Starting ${connection.platform} connection`, { connectionId });

    if (connection.platform === 'facebook') {
      if (connection.connected) {
        logger.info('Disconnecting Facebook connection');
        const result = await handleDisconnect(connectionId);
        if (result?.success) {
          toast({
            title: "Disconnected",
            description: result.message,
          });
        } else {
          toast({
            title: "Disconnection Failed",
            description: result?.error || "Failed to disconnect Facebook",
            variant: "destructive"
          });
        }
      } else {
        logger.info('Starting Facebook connection process');
        clearConnectionError('facebook');
        
        try {
          const result = await handleFacebookConnect();
          
          if (result.success && result.pages && result.pages.length > 0) {
            logger.info('Facebook OAuth successful, showing page selector');
            setAvailablePages(result.pages);
            setUserToken(result.userToken || '');
            setShowPageSelector(true);
          } else if (result.success) {
            toast({
              title: "No Pages Found",
              description: "No Facebook pages were found to connect.",
              variant: "destructive"
            });
          } else {
            logger.error('Facebook connection failed', { error: result.error });
            setConnectionError('facebook', result.error || 'Connection failed');
            toast({
              title: "Connection Failed",
              description: result.error || 'Failed to connect to Facebook',
              variant: "destructive"
            });
          }
        } catch (error) {
          logger.error('Unexpected error during Facebook connection', { error });
          setConnectionError('facebook', 'Unexpected error occurred');
          toast({
            title: "Connection Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive"
          });
        }
      }
    } else {
      toast({
        title: "Coming Soon",
        description: `${connection.name} integration is coming soon!`,
      });
    }
  };

  const handlePageSelectionSuccess = async (connectedPages: number) => {
    toast({
      title: "Pages Connected",
      description: `Successfully connected ${connectedPages} Facebook page${connectedPages !== 1 ? 's' : ''}.`
    });
    
    // Reload connections to reflect new state
    await loadSocialConnections();
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
            connecting={connecting && connection.platform === 'facebook'}
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

      <FacebookPageSelector
        isOpen={showPageSelector}
        onClose={() => setShowPageSelector(false)}
        pages={availablePages}
        userToken={userToken}
        onSuccess={handlePageSelectionSuccess}
      />
    </div>
  );
}