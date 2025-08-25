import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: any;
}

interface FacebookOAuthResult {
  success: boolean;
  error?: string;
  pages?: FacebookPage[];
  userToken?: string;
}

export const useFacebookOAuth = () => {
  const { session } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleFacebookConnect = async (): Promise<FacebookOAuthResult> => {
    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    setConnecting(true);
    logger.info('Starting Facebook OAuth process');

    try {
      // Step 1: Get Facebook OAuth URL
      const { data: authData, error: authError } = await supabase.functions.invoke('facebook-oauth-enhanced', {
        body: { action: 'getAuthUrl' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (authError || !authData?.authUrl) {
        throw new Error(authError?.message || 'Failed to get Facebook authorization URL');
      }

      logger.info('Got Facebook OAuth URL, opening popup');

      // Step 2: Open Facebook OAuth popup
      const popup = window.open(
        authData.authUrl,
        'facebook-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Step 3: Wait for OAuth callback
      const result = await new Promise<FacebookOAuthResult>((resolve) => {
        const timeout = setTimeout(() => {
          popup.close();
          resolve({ success: false, error: 'OAuth timeout - please try again' });
        }, 300000); // 5 minute timeout

        const handleMessage = async (event: MessageEvent) => {
          // Validate origin for security
          if (event.origin !== window.location.origin) {
            logger.warn('Received message from invalid origin', { origin: event.origin });
            return;
          }

          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          popup.close();

          if (event.data.type === 'FACEBOOK_OAUTH_SUCCESS') {
            logger.info('Facebook OAuth callback received', { 
              code: !!event.data.code,
              state: !!event.data.state 
            });

            try {
              // Step 4: Process the callback with our edge function
              const { data: callbackData, error: callbackError } = await supabase.functions.invoke('facebook-oauth-enhanced', {
                body: { 
                  action: 'getPages',
                  code: event.data.code,
                  state: event.data.state,
                  redirect_uri: `${window.location.origin}/facebook-callback.html`
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (callbackError || !callbackData?.success) {
                throw new Error(callbackError?.message || callbackData?.error || 'Failed to process Facebook callback');
              }

              logger.info('Facebook OAuth completed successfully', { 
                pagesCount: callbackData.pages?.length || 0 
              });

              resolve({
                success: true,
                pages: callbackData.pages || [],
                userToken: callbackData.userToken
              });
            } catch (error) {
              logger.error('Failed to process Facebook callback', { error });
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process Facebook authentication'
              });
            }
          } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
            logger.error('Facebook OAuth error received', { error: event.data.error });
            resolve({
              success: false,
              error: event.data.error || 'Facebook authentication failed'
            });
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            clearTimeout(timeout);
            window.removeEventListener('message', handleMessage);
            resolve({ success: false, error: 'Authentication was cancelled' });
          }
        }, 1000);
      });

      return result;
    } catch (error) {
      logger.error('Facebook OAuth error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setConnecting(false);
    }
  };

  const resetConnectionState = () => {
    setConnecting(false);
  };

  return {
    connecting,
    handleFacebookConnect,
    resetConnectionState
  };
};