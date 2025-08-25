import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FacebookPage {
  page_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface InstagramAccount {
  ig_user_id: string;
  page_id: string;
  username: string;
  is_default: boolean;
  created_at: string;
}

export interface AdAccount {
  ad_account_id: string;
  name: string;
  currency: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

export interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

export const useFacebookConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [igAccounts, setIgAccounts] = useState<InstagramAccount[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { session } = useAuth();

  const loadConnectionData = async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      // Load social connections
      const { data: connections, error: connectionsError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'facebook')
        .eq('is_active', true);
      
      if (connectionsError) throw connectionsError;
      setSocialConnections(connections || []);

      // Load Facebook pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('fb_pages')
        .select('*')
        .order('name');
      
      if (pagesError) throw pagesError;
      setPages(pagesData || []);

      // Load Instagram accounts
      const { data: igData, error: igError } = await supabase
        .from('ig_accounts')
        .select('*')
        .order('username');
      
      if (igError) throw igError;
      setIgAccounts(igData || []);

      // Load ad accounts
      const { data: adData, error: adError } = await supabase
        .from('ad_accounts')
        .select('*')
        .order('name');
      
      if (adError) throw adError;
      setAdAccounts(adData || []);

    } catch (error) {
      console.error('Error loading connection data:', error);
      toast.error('Failed to load connection data');
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    if (!session?.access_token) {
      toast.error('Please log in first');
      return;
    }

    setIsConnecting(true);
    try {
      // Get auth URL from edge function
      const { data, error } = await supabase.functions.invoke('facebook-oauth-enhanced', {
        body: { action: 'getAuthUrl' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Store state for validation
      sessionStorage.setItem('fb_oauth_state', data.state);
      sessionStorage.setItem('fb_redirect_uri', data.redirectUri);
      
      // Redirect to Facebook
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Facebook connection error:', error);
      toast.error('Failed to initiate Facebook connection');
      setIsConnecting(false);
    }
  };

  const handleCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem('fb_oauth_state');
    const redirectUri = sessionStorage.getItem('fb_redirect_uri');
    
    if (state !== storedState) {
      toast.error('Invalid callback state');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('facebook-oauth-enhanced', {
        body: { 
          action: 'handleCallback',
          code,
          state,
          redirect_uri: redirectUri
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      // Clean up session storage
      sessionStorage.removeItem('fb_oauth_state');
      sessionStorage.removeItem('fb_redirect_uri');

      toast.success(`Facebook connected! ${data.data.pagesCount} pages and ${data.data.adAccountsCount} ad accounts found.`);
      
      // Reload connection data
      await loadConnectionData();
      
      return true;
    } catch (error) {
      console.error('Callback handling error:', error);
      toast.error('Failed to complete Facebook connection');
      return false;
    }
  };

  const disconnect = async () => {
    try {
      // Deactivate social connections
      const { error: connectionError } = await supabase
        .from('social_connections')
        .update({ is_active: false })
        .eq('platform', 'facebook');
      
      if (connectionError) throw connectionError;

      // Delete pages, IG accounts, and ad accounts
      await Promise.all([
        supabase.from('fb_pages').delete().neq('page_id', ''),
        supabase.from('ig_accounts').delete().neq('ig_user_id', ''),
        supabase.from('ad_accounts').delete().neq('ad_account_id', '')
      ]);

      toast.success('Facebook disconnected successfully');
      
      // Reload data
      await loadConnectionData();
      
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect Facebook');
    }
  };

  const setDefaultPage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('fb_pages')
        .update({ is_default: true })
        .eq('page_id', pageId);
      
      if (error) throw error;
      
      toast.success('Default page updated');
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error setting default page:', error);
      toast.error('Failed to set default page');
    }
  };

  const setDefaultIgAccount = async (igUserId: string) => {
    try {
      const { error } = await supabase
        .from('ig_accounts')
        .update({ is_default: true })
        .eq('ig_user_id', igUserId);
      
      if (error) throw error;
      
      toast.success('Default Instagram account updated');
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error setting default IG account:', error);
      toast.error('Failed to set default Instagram account');
    }
  };

  const setDefaultAdAccount = async (adAccountId: string) => {
    try {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ is_default: true })
        .eq('ad_account_id', adAccountId);
      
      if (error) throw error;
      
      toast.success('Default ad account updated');
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error setting default ad account:', error);
      toast.error('Failed to set default ad account');
    }
  };

  return {
    // State
    isConnecting,
    pages,
    igAccounts,
    adAccounts,
    socialConnections,
    loading,
    
    // Actions
    loadConnectionData,
    initiateConnection,
    handleCallback,
    disconnect,
    setDefaultPage,
    setDefaultIgAccount,
    setDefaultAdAccount,
    
    // Computed
    isConnected: socialConnections.length > 0,
    hasPages: pages.length > 0,
    hasIgAccounts: igAccounts.length > 0,
    hasAdAccounts: adAccounts.length > 0,
  };
};