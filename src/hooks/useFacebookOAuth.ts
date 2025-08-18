import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: any;
}

interface FacebookOAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  pages?: FacebookPage[];
  userToken?: string;
}

export const useFacebookOAuth = () => {
  const { user, session } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const connectionAttemptRef = useRef<string | null>(null);

  const handleFacebookConnect = async (): Promise<FacebookOAuthResult> => {
    if (!session?.access_token) {
      logger.error('Facebook connect failed: no session token');
      return { success: false, error: 'Authentication required' };
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current) {
      logger.warn('Facebook connection already in progress');
      return { success: false, error: 'Connection already in progress' };
    }

    const attemptId = crypto.randomUUID();
    connectionAttemptRef.current = attemptId;
    setConnecting(true);
    
    logger.info('Starting Facebook OAuth process', { attemptId });
    
    try {
      const response = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'getAuthUrl' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get Facebook auth URL');
      }

      logger.info('Auth URL received, opening popup', { attemptId });

      const authWindow = window.open(
        response.data.authUrl, 
        'facebook-oauth', 
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!authWindow) {
        logger.error('Failed to open popup window');
        throw new Error('Failed to open authentication window. Please allow popups for this site.');
      }
      
      // Listen for OAuth completion
      return new Promise((resolve) => {
        let resolved = false;
        
        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            window.removeEventListener('message', handleMessage);
            connectionAttemptRef.current = null;
            setConnecting(false);
          }
        };

        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (connectionAttemptRef.current !== attemptId) return; // Ignore stale events
          
          logger.info('Received message from popup', { type: event.data.type, attemptId });
          
          if (event.data.type === 'FACEBOOK_OAUTH_CODE') {
            try {
              logger.info('Processing OAuth callback', { attemptId });
              
              const result = await supabase.functions.invoke('facebook-oauth', {
                body: { 
                  action: 'handleCallback',
                  code: event.data.code,
                  state: event.data.state
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`
                }
              });

              if (result.error) {
                throw new Error(result.error.message || 'Callback processing failed');
              }
              
              logger.info('Facebook connection successful', { 
                pages: result.data.pages?.length || 0,
                attemptId 
              });
              
              cleanup();
              
              resolve({
                success: true,
                message: result.data.message,
                pages: result.data.pages || [],
                userToken: result.data.userToken
              });
            } catch (error) {
              logger.error('Failed to process Facebook callback', { error, attemptId });
              const errorId = errorHandler.log(error as Error);
              errorHandler.showUserFriendlyError(errorId, 'Failed to process Facebook connection. Please try again.');
              
              cleanup();
              
              resolve({
                success: false,
                error: (error as Error).message
              });
            }
          } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
            const errorMsg = event.data.error || "Failed to connect to Facebook";
            logger.error('Facebook OAuth error received', { error: errorMsg, attemptId });
            const errorId = errorHandler.log(new Error(errorMsg));
            errorHandler.showUserFriendlyError(errorId);
            
            cleanup();
            
            resolve({
              success: false,
              error: errorMsg
            });
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Set timeout for OAuth process with proper cleanup
        const timeoutId = setTimeout(() => {
          if (connectionAttemptRef.current === attemptId && !resolved) {
            logger.warn('Facebook OAuth timed out', { attemptId });
            
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            
            cleanup();
            clearTimeout(timeoutId);
            
            resolve({
              success: false,
              error: 'Authentication timed out. Please try again.'
            });
          }
        }, 300000); // 5 minute timeout
      });
      
    } catch (error) {
      logger.error('Failed to start Facebook connection', { error, attemptId });
      const errorId = errorHandler.log(error as Error);
      errorHandler.showUserFriendlyError(errorId, 'Failed to start Facebook connection. Please try again.');
      
      connectionAttemptRef.current = null;
      setConnecting(false);
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  };

  return {
    connecting,
    handleFacebookConnect
  };
};