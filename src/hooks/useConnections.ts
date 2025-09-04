import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLATFORMS } from '@/constants/platforms';
import type { Connection, SocialConnection } from '@/constants/platforms';
import { logger } from '@/utils/logger';

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionErrors, setConnectionErrors] = useState<Record<string, string>>({});

  // Load social connections from database
  const loadSocialConnections = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      logger.info('Loading social connections', { userId: user.id });

      // Fetch social connections
      const { data: socialConnectionsData, error: socialError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (socialError) {
        logger.error('Error loading social connections', { error: socialError });
        throw socialError;
      }


      setSocialConnections(socialConnectionsData || []);
      
      // Map platform data to UI connections
      const updatedConnections = PLATFORMS.map(platform => {
        const socialConnection = socialConnectionsData?.find(sc => sc.platform === platform.id);
        const isConnected = !!socialConnection;

        return {
          ...platform,
          connected: isConnected,
          enabled: socialConnection?.is_active || false
        };
      });

      setConnections(updatedConnections);
      logger.info('Social connections loaded successfully', { 
        connectionsCount: socialConnectionsData?.length || 0
      });
    } catch (error) {
      logger.error('Failed to load social connections', { error });
      setConnectionErrors(prev => ({
        ...prev,
        general: 'Failed to load connections'
      }));
    } finally {
      setIsLoading(false);
    }
  };


  // Toggle enabled state for a connection
  const handleToggleEnabled = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !connection.connected || !user) return;

    try {
      logger.info('Toggling connection enabled state', { 
        platform: connection.platform, 
        currentEnabled: connection.enabled 
      });

      const { error } = await supabase
        .from('social_connections')
        .update({ is_active: !connection.enabled })
        .eq('user_id', user.id)
        .eq('platform', connection.platform);

      if (error) throw error;

      await loadSocialConnections();
    } catch (error) {
      logger.error('Failed to toggle connection state', { error, platform: connection.platform });
      setConnectionErrors(prev => ({
        ...prev,
        [connection.platform]: 'Failed to update connection state'
      }));
    }
  };

  // Error management
  const clearConnectionError = (platform: string) => {
    setConnectionErrors(prev => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  };

  const setConnectionError = (platform: string, error: string) => {
    setConnectionErrors(prev => ({
      ...prev,
      [platform]: error
    }));
  };

  // Load data on mount
  useEffect(() => {
    loadSocialConnections();
  }, [user]);

  return {
    connections,
    socialConnections,
    isLoading,
    connectionErrors,
    loadSocialConnections,
    handleToggleEnabled,
    clearConnectionError,
    setConnectionError
  };
};