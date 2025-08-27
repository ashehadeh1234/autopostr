import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface InstagramAccount {
  ig_user_id: string;
  username: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
}

interface ConnectionResult {
  ok: boolean;
  pages: FacebookPage[];
  ig_accounts: InstagramAccount[];
  state?: string;
  error?: string;
}

export const useNewFacebookConnection = () => {
  const { session } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const initiateConnection = async (): Promise<{ authorize_url?: string; error?: string }> => {
    if (!session?.access_token) {
      return { error: 'Not authenticated' };
    }

    setConnecting(true);
    logger.info('Initiating Facebook connection');

    try {
      const { data, error } = await supabase.functions.invoke('facebook-connect', {
        body: { route: 'authorize' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      logger.info('Got authorization URL');
      return { authorize_url: data.authorize_url };
    } catch (error) {
      logger.error('Failed to initiate Facebook connection', { error });
      return { 
        error: error instanceof Error ? error.message : 'Failed to initiate connection' 
      };
    } finally {
      setConnecting(false);
    }
  };

  const handleCallback = async (code: string, state: string): Promise<ConnectionResult> => {
    logger.info('Processing Facebook callback');

    try {
      const callbackUrl = `https://wpobzmfjkxffnpddisrc.supabase.co/functions/v1/facebook-connect/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      
      const response = await fetch(callbackUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Callback processing failed');
      }

      if (!data.ok) {
        throw new Error(data.error || 'Callback processing failed');
      }

      logger.info('Facebook callback processed successfully', {
        pagesCount: data.pages?.length || 0,
        igAccountsCount: data.ig_accounts?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Failed to process Facebook callback', { error });
      return {
        ok: false,
        pages: [],
        ig_accounts: [],
        error: error instanceof Error ? error.message : 'Callback processing failed'
      };
    }
  };

  const saveConnections = async (pages: FacebookPage[], igAccounts: InstagramAccount[]): Promise<{ ok: boolean; error?: string }> => {
    if (!session?.access_token) {
      return { ok: false, error: 'Not authenticated' };
    }

    setSaving(true);
    logger.info('Saving social connections', {
      pagesCount: pages.length,
      igAccountsCount: igAccounts.length
    });

    try {
      const { data, error } = await supabase.functions.invoke('facebook-connect', {
        body: {
          route: 'save-connections',
          pages,
          ig_accounts: igAccounts
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.ok) {
        throw new Error(data.error || 'Failed to save connections');
      }

      logger.info('Connections saved successfully', { saved: data.saved });
      return { ok: true };
    } catch (error) {
      logger.error('Failed to save connections', { error });
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save connections'
      };
    } finally {
      setSaving(false);
    }
  };

  const loadConnections = async () => {
    if (!session?.user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        logger.error('Failed to load connections', { error });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to load connections', { error });
      return [];
    }
  };

  return {
    connecting,
    saving,
    initiateConnection,
    handleCallback,
    saveConnections,
    loadConnections
  };
};