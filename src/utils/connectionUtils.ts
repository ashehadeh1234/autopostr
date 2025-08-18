import { supabase } from "@/integrations/supabase/client";
import { errorHandler } from "./errorHandling";

export interface ConnectionHealth {
  platform: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastChecked: number;
  tokenExpiry?: number;
  issues: string[];
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ConnectionManager {
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: Record<string, any>
  ): Promise<T> {
    const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = {
      ...this.defaultRetryConfig,
      ...config
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const errorId = errorHandler.log(lastError, {
          ...context,
          attempt,
          maxAttempts
        });

        console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);
        
        if (attempt === maxAttempts) {
          errorHandler.showUserFriendlyError(errorId);
          break;
        }
        
        const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkConnectionHealth(platform: string, userId: string): Promise<ConnectionHealth> {
    try {
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('is_active', true);

      if (error) throw error;

      const health: ConnectionHealth = {
        platform,
        status: 'unknown',
        lastChecked: Date.now(),
        issues: []
      };

      if (!connections || connections.length === 0) {
        health.status = 'error';
        health.issues.push('No active connections found');
        return health;
      }

      // Check token expiry
      let hasExpiredTokens = false;
      let hasExpiringTokens = false;
      const now = Date.now();
      const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const connection of connections) {
        if (connection.token_expires_at) {
          const expiryTime = new Date(connection.token_expires_at).getTime();
          health.tokenExpiry = Math.min(health.tokenExpiry || Infinity, expiryTime);
          
          if (expiryTime < now) {
            hasExpiredTokens = true;
            health.issues.push(`Connection ${connection.page_name || connection.platform_username} has expired token`);
          } else if (expiryTime < now + warningThreshold) {
            hasExpiringTokens = true;
            health.issues.push(`Connection ${connection.page_name || connection.platform_username} token expires soon`);
          }
        }
      }

      if (hasExpiredTokens) {
        health.status = 'error';
      } else if (hasExpiringTokens) {
        health.status = 'warning';
      } else {
        health.status = 'healthy';
      }

      return health;
    } catch (error) {
      const errorId = errorHandler.log(error as Error, { platform, userId });
      return {
        platform,
        status: 'error',
        lastChecked: Date.now(),
        issues: [`Health check failed: ${(error as Error).message}`]
      };
    }
  }

  async testConnection(platform: string, connectionId: string): Promise<boolean> {
    // This would be implemented based on platform-specific testing logic
    // For now, we'll just check if the connection exists and is active
    try {
      const { data: connection, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      return !!connection;
    } catch (error) {
      errorHandler.log(error as Error, { platform, connectionId });
      return false;
    }
  }

  async refreshConnection(platform: string, connectionId: string): Promise<boolean> {
    // This would implement platform-specific token refresh logic
    // For now, we'll simulate the refresh process
    try {
      // Platform-specific refresh logic would go here
      console.log(`Refreshing connection for ${platform}:${connectionId}`);
      return true;
    } catch (error) {
      errorHandler.log(error as Error, { platform, connectionId });
      return false;
    }
  }
}

export const connectionManager = new ConnectionManager();