/**
 * @fileoverview Connection Utilities
 * 
 * Provides simplified utilities for managing social media platform connections.
 * These utilities handle database operations for social connections without
 * complex retry logic or over-engineering.
 * 
 * @author Social Media Manager Team
 * @version 2.0 - Refactored for simplicity
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

/**
 * Connection utilities for managing social media platform integrations.
 * 
 * These utilities provide a clean interface for:
 * - Loading user's social connections from database
 * - Testing connection health
 * - Disconnecting platforms
 * 
 * All functions use simple error handling without retry mechanisms.
 */
export const connectionUtils = {
  /**
   * Loads all active social connections for a specific user.
   * 
   * @param userId - The unique identifier of the user
   * @returns Promise<Array> - Array of social connection objects
   * @throws Error if database query fails
   * 
   * @example
   * ```typescript
   * const connections = await connectionUtils.loadSocialConnections(user.id);
   * console.log(`User has ${connections.length} connections`);
   * ```
   */
  async loadSocialConnections(userId: string) {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        logger.error(`Failed to load social connections: ${error.message}`);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error loading social connections', error);
      throw error;
    }
  },

  /**
   * Tests if a connection is active and valid.
   * 
   * @param connectionId - The unique identifier of the connection to test
   * @returns Promise<boolean> - True if connection is active, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = await connectionUtils.testConnection('conn_123');
   * if (isValid) {
   *   console.log('Connection is healthy');
   * }
   * ```
   */
  async testConnection(connectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('id')
        .eq('id', connectionId)
        .eq('is_active', true)
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      logger.error('Error testing connection', error);
      return false;
    }
  },

  /**
   * Disconnects a user from a specific social media platform.
   * 
   * Sets the is_active flag to false for all connections of the specified
   * platform for the given user. Does not delete the connection records.
   * 
   * @param userId - The unique identifier of the user
   * @param platform - The platform name (e.g., 'facebook', 'twitter')
   * @returns Promise<boolean> - True if disconnect was successful
   * @throws Error if database update fails
   * 
   * @example
   * ```typescript
   * await connectionUtils.disconnectPlatform(user.id, 'facebook');
   * console.log('User disconnected from Facebook');
   * ```
   */
  async disconnectPlatform(userId: string, platform: string) {
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform', platform);

      if (error) {
        logger.error(`Failed to disconnect ${platform}: ${error.message}`);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error disconnecting platform', error);
      throw error;
    }
  }
};