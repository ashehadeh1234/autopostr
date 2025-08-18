import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';

interface FacebookOAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  pages?: number;
}

export const useFacebookOAuth = () => {
  const { user, session } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleFacebookConnect = async (): Promise<FacebookOAuthResult> => {
    if (!session?.access_token) {
      logger.error('Facebook connect failed: no session token');
      return { success: false, error: 'Authentication required' };
    }
    
    setConnecting(true);
    
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

      const authWindow = window.open(response.data.authUrl, 'facebook-oauth', 'width=600,height=600');
      
      if (!authWindow) {
        logger.error('Failed to open popup window');
        throw new Error('Failed to open authentication window. Please allow popups for this site.');
      }
      
      // Listen for OAuth completion
      return new Promise((resolve) => {
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'FACEBOOK_OAUTH_CODE') {
            try {
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
              
              window.removeEventListener('message', handleMessage);
              setConnecting(false);
              
              resolve({
                success: true,
                message: `Successfully connected ${result.data.pages?.length || 0} Facebook pages.`,
                pages: result.data.pages?.length || 0
              });
            } catch (error) {
              const errorId = errorHandler.log(error as Error);
              errorHandler.showUserFriendlyError(errorId, 'Failed to process Facebook connection. Please try again.');
              
              window.removeEventListener('message', handleMessage);
              setConnecting(false);
              
              resolve({
                success: false,
                error: (error as Error).message
              });
            }
          } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
            const errorMsg = event.data.error || "Failed to connect to Facebook";
            const errorId = errorHandler.log(new Error(errorMsg));
            errorHandler.showUserFriendlyError(errorId);
            
            window.removeEventListener('message', handleMessage);
            setConnecting(false);
            
            resolve({
              success: false,
              error: errorMsg
            });
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Set timeout for OAuth process
        setTimeout(() => {
          if (connecting) {
            window.removeEventListener('message', handleMessage);
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            setConnecting(false);
            resolve({
              success: false,
              error: 'Authentication timed out. Please try again.'
            });
          }
        }, 300000); // 5 minute timeout
      });
      
    } catch (error) {
      const errorId = errorHandler.log(error as Error);
      errorHandler.showUserFriendlyError(errorId, 'Failed to start Facebook connection. Please try again.');
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