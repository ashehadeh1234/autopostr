import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

// Simple connection utilities without complex retry logic
export const connectionUtils = {
  // Basic database query with simple error handling
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

  // Simple connection test
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

  // Simple disconnect
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