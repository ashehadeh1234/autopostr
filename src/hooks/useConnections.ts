/**
 * @fileoverview Connections Management Hook
 * 
 * Custom React hook for managing social media platform connections.
 * Handles loading, connecting, disconnecting, and state management
 * for all social platforms.
 * 
 * @author Social Media Manager Team
 * @version 2.0 - Simplified and extracted from component
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connectionUtils } from '@/utils/connectionUtils';
import { errorHandler } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';
import { Connection, SocialConnection, PLATFORMS } from '@/constants/platforms';

/**
 * Custom hook for managing social media platform connections.
 * 
 * Provides:
 * - Loading and syncing connection states
 * - Connecting and disconnecting platforms
 * - Error handling and display
 * - Auto-posting toggle functionality
 * 
 * @returns Object containing connection state and management functions
 * 
 * @example
 * ```typescript
 * const {
 *   connections,
 *   isLoading,
 *   handleDisconnect,
 *   handleToggleEnabled
 * } = useConnections();
 * ```
 */
export const useConnections = () => {
  const { user } = useAuth();
  
  // Connection state management
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

  /**
   * Loads social connections from database and updates UI state.
   * 
   * Fetches all active connections for the current user and merges
   * them with the platform configurations to create the final UI state.
   */
  const loadSocialConnections = async () => {
    if (!user) return;

    try {
      const data = await connectionUtils.loadSocialConnections(user.id);
      
      setSocialConnections(data);
      setConnectionErrors({});
      
      // Update connections state based on database data
      setConnections(prev => prev.map(conn => {
        const dbConnections = data.filter(sc => sc.platform === conn.platform) || [];
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
      const errorId = errorHandler.log(error as Error, { operation: 'loadSocialConnections', userId: user.id });
      errorHandler.showUserFriendlyError(errorId);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles disconnecting a platform.
   * 
   * @param connectionId - The platform ID to disconnect
   * @returns Promise with success/error result
   */
  const handleDisconnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !user) return;

    try {
      await connectionUtils.disconnectPlatform(user.id, connection.platform);
      await loadSocialConnections();
      
      return { 
        success: true, 
        message: `${connection.name} has been disconnected.` 
      };
    } catch (error) {
      const errorId = errorHandler.log(error as Error);
      errorHandler.showUserFriendlyError(errorId, 'Failed to disconnect platform');
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  };

  /**
   * Toggles auto-posting for a connected platform.
   * 
   * @param connectionId - The platform ID to toggle
   */
  const handleToggleEnabled = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, enabled: !conn.enabled }
          : conn
      )
    );
  };

  /**
   * Clears error message for a specific platform.
   * 
   * @param platform - Platform name to clear error for
   */
  const clearConnectionError = (platform: string) => {
    setConnectionErrors(prev => ({ ...prev, [platform]: '' }));
  };

  /**
   * Sets error message for a specific platform.
   * 
   * @param platform - Platform name to set error for
   * @param error - Error message to display
   */
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