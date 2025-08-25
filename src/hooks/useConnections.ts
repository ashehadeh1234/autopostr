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

      // Fetch Facebook pages
      const { data: fbPagesData, error: fbError } = await supabase
        .from('fb_pages')
        .select('*')
        .eq('user_id', user.id);

      if (fbError) {
        logger.error('Error loading Facebook pages', { error: fbError });
        throw fbError;
      }

      setSocialConnections(socialConnectionsData || []);
      
      // Map platform data to UI connections
      const updatedConnections = PLATFORMS.map(platform => {
        const socialConnection = socialConnectionsData?.find(sc => sc.platform === platform.id);
        const isConnected = !!socialConnection;
        
        // For Facebook, add pages info
        let pages: any[] = [];
        if (platform.id === 'facebook' && isConnected) {
          pages = fbPagesData || [];
        }

        return {
          ...platform,
          connected: isConnected,
          enabled: socialConnection?.is_active || false,
          pages: pages.length > 0 ? pages : undefined
        };
      });

      setConnections(updatedConnections);
      logger.info('Social connections loaded successfully', { 
        connectionsCount: socialConnectionsData?.length || 0,
        fbPagesCount: fbPagesData?.length || 0
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

  // Disconnect a platform
  const handleDisconnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !user) return { success: false, error: 'Connection not found' };

    try {
      logger.info('Disconnecting platform', { platform: connection.platform, userId: user.id });

      if (connection.platform === 'facebook') {
        // Deactivate social connections
        const { error: socialError } = await supabase
          .from('social_connections')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('platform', 'facebook');

        if (socialError) throw socialError;

        // Get Facebook pages first, then delete Instagram accounts
        const { data: fbPages } = await supabase
          .from('fb_pages')
          .select('page_id')
          .eq('user_id', user.id);

        if (fbPages && fbPages.length > 0) {
          const pageIds = fbPages.map(p => p.page_id);
          const { error: igError } = await supabase
            .from('ig_accounts')
            .delete()
            .in('page_id', pageIds);

          if (igError) throw igError;
        }

        // Delete Facebook pages
        const { error: pagesError } = await supabase
          .from('fb_pages')
          .delete()
          .eq('user_id', user.id);

        if (pagesError) throw pagesError;

        // Delete ad accounts
        const { error: adError } = await supabase
          .from('ad_accounts')
          .update({ status: 'INACTIVE' })
          .eq('user_id', user.id);

        if (adError) throw adError;
      }

      await loadSocialConnections();
      return { success: true, message: `${connection.name} disconnected successfully` };
    } catch (error) {
      logger.error('Failed to disconnect platform', { error, platform: connection.platform });
      return { success: false, error: 'Failed to disconnect. Please try again.' };
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
    handleDisconnect,
    handleToggleEnabled,
    clearConnectionError,
    setConnectionError
  };
};