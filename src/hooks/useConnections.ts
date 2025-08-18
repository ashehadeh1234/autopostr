import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { connectionManager } from '@/utils/connectionUtils';
import { errorHandler } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';
import { Connection, SocialConnection, PLATFORMS } from '@/constants/platforms';

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>(PLATFORMS);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionErrors, setConnectionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      logger.info('Loading social connections');
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
      const errorId = errorHandler.log(error, { operation: 'loadSocialConnections', userId: user?.id });
      errorHandler.showUserFriendlyError(errorId);
      setIsLoading(false);
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
      
      return { success: true, message: `${connection.name} has been disconnected.` };
    } catch (error) {
      const errorId = errorHandler.log(error as Error);
      errorHandler.showUserFriendlyError(errorId, 'Failed to disconnect platform');
      return { success: false, error: (error as Error).message };
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

  const clearConnectionError = (platform: string) => {
    setConnectionErrors(prev => ({ ...prev, [platform]: '' }));
  };

  const setConnectionError = (platform: string, error: string) => {
    setConnectionErrors(prev => ({ ...prev, [platform]: error }));
  };

  return {
    connections,
    socialConnections,
    isLoading,
    connectionErrors,
    loadSocialConnections,
    handleDisconnect,
    handleToggleEnabled,
    clearConnectionError,
    setConnectionError
  };
};