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

  const resetConnectionState = () => {
    connectionAttemptRef.current = null;
    setConnecting(false);
  };

  const handleFacebookConnect = async (): Promise<FacebookOAuthResult> => {
    if (!session?.access_token) {
      logger.error('Facebook connect failed: no session token');
      return { success: false, error: 'Authentication required' };
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current) {
      logger.warn('Facebook connection already in progress');
      return { success: false, error: 'Connection already in progress. Please wait for the current attempt to complete.' };
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
          // Ignore stale events from previous attempts
          if (connectionAttemptRef.current !== attemptId) {
            logger.warn('Ignoring message from stale connection attempt');
            return;
          }
          
          // Allow messages from same origin or any origin for flexibility
          const validOrigin = event.origin === window.location.origin || 
                             event.origin === 'null' || 
                             event.origin.includes(window.location.hostname);
          
          if (!validOrigin) {
            logger.warn('Message from invalid origin', { origin: event.origin });
            return;
          }
          
          logger.info('Received message from popup', { 
            type: event.data.type, 
            attemptId,
            origin: event.origin 
          });
          
          if (event.data.type === 'FACEBOOK_OAUTH_CODE') {
            try {
              logger.info('Processing OAuth callback', { attemptId });
              
              // Add small delay to prevent race conditions with multiple tabs
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Double-check we're still the active attempt
              if (connectionAttemptRef.current !== attemptId) {
                logger.warn('Connection attempt superseded, canceling');
                return;
              }
              
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
              
              // Don't cleanup here - let the parent component handle state after page selection
              window.removeEventListener('message', handleMessage);
              connectionAttemptRef.current = null;
              // Keep setConnecting(true) until page selection is complete
              
              resolve({
                success: true,
                message: result.data.message,
                pages: result.data.pages || [],
                userToken: result.data.userToken
              });
            } catch (error) {
              logger.error('Failed to process Facebook callback', { error, attemptId });
              
              // Handle specific Facebook OAuth errors with better messaging
              let userMessage = 'Failed to process Facebook connection. Please try again.';
              const errorMsg = (error as Error).message?.toLowerCase() || '';
              
              if (errorMsg.includes('authorization code has been used') || 
                  errorMsg.includes('already been processed')) {
                userMessage = 'This connection attempt has already been processed. Please start a new connection.';
              } else if (errorMsg.includes('expired')) {
                userMessage = 'The connection attempt has expired. Please try connecting again.';
              } else if (errorMsg.includes('timeout')) {
                userMessage = 'Connection timed out. Please check your internet connection and try again.';
              }
              
              const errorId = errorHandler.log(error as Error);
              errorHandler.showUserFriendlyError(errorId, userMessage);
              
              cleanup();
              
              resolve({
                success: false,
                error: userMessage
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
    handleFacebookConnect,
    resetConnectionState
  };
};