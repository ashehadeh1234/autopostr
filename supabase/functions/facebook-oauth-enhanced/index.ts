import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookUserResponse {
  id: string;
  name: string;
  email?: string;
}

interface FacebookPageResponse {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    category_list: Array<{ id: string; name: string }>;
    tasks: string[];
  }>;
  paging?: {
    next?: string;
    previous?: string;
  };
}

interface FacebookIGAccountResponse {
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

interface FacebookAdAccountResponse {
  data: Array<{
    id: string;
    name: string;
    currency: string;
    account_status: number;
    disable_reason?: string;
    business?: {
      id: string;
      name: string;
    };
  }>;
}

const validateUser = async (supabase: any, authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
};

const getAuthUrl = (state: string, redirectUri: string): string => {
  const APP_ID = Deno.env.get('META_APP_ID');
  if (!APP_ID) throw new Error('META_APP_ID not configured');

  // Comprehensive scopes for full AutoPostr functionality
  const scopes = [
    'pages_manage_posts',
    'pages_read_engagement', 
    'pages_show_list',
    'pages_read_user_content',
    'pages_manage_engagement',
    'pages_manage_metadata',
    'read_insights',
    'ads_management',
    'ads_read',
    'pages_manage_ads',
    'business_management',
    'instagram_basic',
    'instagram_content_publish'
  ].join(',');

  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state: state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

const exchangeCodeForToken = async (code: string, redirectUri: string): Promise<string> => {
  const APP_ID = Deno.env.get('META_APP_ID');
  const APP_SECRET = Deno.env.get('META_APP_SECRET');
  
  if (!APP_ID || !APP_SECRET) {
    throw new Error('Facebook app credentials not configured');
  }

  // Exchange code for short-lived token
  const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${APP_SECRET}` +
    `&code=${code}`;

  const tokenResponse = await fetch(tokenUrl);
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(`Facebook token exchange failed: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
};

const getLongLivedToken = async (shortToken: string): Promise<{ access_token: string; expires_in?: number }> => {
  const APP_ID = Deno.env.get('META_APP_ID');
  const APP_SECRET = Deno.env.get('META_APP_SECRET');

  const longTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${APP_ID}` +
    `&client_secret=${APP_SECRET}` +
    `&fb_exchange_token=${shortToken}`;

  const response = await fetch(longTokenUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Long-lived token exchange failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const fetchUserProfile = async (accessToken: string): Promise<FacebookUserResponse> => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }
  
  return await response.json();
};

const fetchPages = async (accessToken: string): Promise<FacebookPageResponse> => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,category_list,tasks&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.statusText}`);
  }
  
  return await response.json();
};

const fetchInstagramAccount = async (pageId: string, pageToken: string): Promise<FacebookIGAccountResponse> => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageToken}`
  );
  
  if (!response.ok) {
    // IG account might not exist for this page
    return {};
  }
  
  return await response.json();
};

const fetchAdAccounts = async (accessToken: string): Promise<FacebookAdAccountResponse> => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,account_status,disable_reason,business{id,name}&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    // User might not have ad account access
    console.warn(`Failed to fetch ad accounts: ${response.statusText}`);
    return { data: [] };
  }
  
  return await response.json();
};

const saveConnectionData = async (
  supabase: any,
  userId: string,
  userProfile: FacebookUserResponse,
  longLivedToken: { access_token: string; expires_in?: number },
  pages: FacebookPageResponse,
  adAccounts: FacebookAdAccountResponse
) => {
  // Calculate token expiry
  const expiresAt = longLivedToken.expires_in 
    ? new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString()
    : null;

  // Save/update main social connection
  const { error: connectionError } = await supabase
    .from('social_connections')
    .upsert({
      user_id: userId,
      platform: 'facebook',
      platform_user_id: userProfile.id,
      platform_username: userProfile.name,
      access_token_encrypted: supabase.rpc('encrypt_token', { plaintext_token: longLivedToken.access_token }),
      token_expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,platform,platform_user_id'
    });

  if (connectionError) {
    throw new Error(`Failed to save social connection: ${connectionError.message}`);
  }

  // Save Facebook pages
  for (const page of pages.data) {
    // Check if user has manage_pages permission for this page
    const canManage = page.tasks?.includes('MANAGE') || page.tasks?.includes('CREATE_CONTENT');
    
    if (canManage) {
      const { error: pageError } = await supabase
        .from('fb_pages')
        .upsert({
          page_id: page.id,
          user_id: userId,
          name: page.name,
          page_access_token_encrypted: supabase.rpc('encrypt_token', { plaintext_token: page.access_token }),
          is_default: false, // Will be set by user later
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_id'
        });

      if (pageError) {
        console.error(`Failed to save page ${page.id}:`, pageError);
        continue;
      }

      // Try to fetch Instagram account for this page
      try {
        const igAccount = await fetchInstagramAccount(page.id, page.access_token);
        
        if (igAccount.instagram_business_account) {
          const { error: igError } = await supabase
            .from('ig_accounts')
            .upsert({
              ig_user_id: igAccount.instagram_business_account.id,
              page_id: page.id,
              username: igAccount.instagram_business_account.username,
              is_default: false,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'ig_user_id'
            });

          if (igError) {
            console.error(`Failed to save IG account for page ${page.id}:`, igError);
          }
        }
      } catch (error) {
        console.warn(`No Instagram account found for page ${page.id}:`, error);
      }
    }
  }

  // Save ad accounts
  for (const adAccount of adAccounts.data) {
    // Only save active ad accounts
    if (adAccount.account_status === 1) {
      const { error: adError } = await supabase
        .from('ad_accounts')
        .upsert({
          ad_account_id: adAccount.id,
          user_id: userId,
          name: adAccount.name,
          currency: adAccount.currency,
          status: 'ACTIVE',
          is_default: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ad_account_id'
        });

      if (adError) {
        console.error(`Failed to save ad account ${adAccount.id}:`, adError);
      }
    }
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Facebook OAuth Enhanced Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    const user = await validateUser(supabase, authHeader);
    
    // Parse request body from supabase.functions.invoke()
    let requestBody = null;
    let action = null;
    
    try {
      // supabase.functions.invoke() sends JSON directly
      requestBody = await req.json();
      action = requestBody?.action;
      console.log('Parsed request body:', requestBody);
      console.log('Action:', action);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      
      // Fallback to URL params for GET requests
      const url = new URL(req.url);
      action = url.searchParams.get('action');
      console.log('Fallback action from URL:', action);
    }
    
    console.log('Request body:', requestBody);
    console.log('Action:', action);

    if (!action) {
      console.error('No action found in request');
      return new Response(JSON.stringify({ 
        error: 'No action specified. Use getAuthUrl, getPages, handleCallback, or saveSelectedPages' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'getAuthUrl': {
        const url = new URL(req.url);
        const redirectUri = url.searchParams.get('redirect_uri') || 
          `${url.protocol}//${url.host}/facebook-callback.html`;
        const state = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const authUrl = getAuthUrl(state, redirectUri);
        
        return new Response(JSON.stringify({ 
          authUrl,
          state,
          redirectUri 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'getPages': {
        const { code, state, redirect_uri } = requestBody || {};
        
        if (!code) {
          throw new Error('Authorization code is required');
        }

        // Validate state parameter
        const [stateUserId] = state.split('-');
        if (stateUserId !== user.id) {
          throw new Error('Invalid state parameter');
        }

        console.log('Exchanging code for token...');
        const shortToken = await exchangeCodeForToken(code, redirect_uri);
        
        console.log('Getting long-lived token...');
        const longLivedToken = await getLongLivedToken(shortToken);
        
        console.log('Fetching user profile...');
        const userProfile = await fetchUserProfile(longLivedToken.access_token);
        
        console.log('Fetching pages...');
        const pages = await fetchPages(longLivedToken.access_token);

        // Return pages for user selection instead of auto-saving
        return new Response(JSON.stringify({
          success: true,
          pages: pages.data.map(page => ({
            id: page.id,
            name: page.name,
            access_token: page.access_token,
            instagram_business_account: null // Will be fetched when pages are selected
          })),
          userToken: longLivedToken.access_token
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'handleCallback': {
        const { code, state, redirect_uri } = requestBody || {};
        
        if (!code) {
          throw new Error('Authorization code is required');
        }

        // Validate state parameter
        const [stateUserId] = state.split('-');
        if (stateUserId !== user.id) {
          throw new Error('Invalid state parameter');
        }

        console.log('Exchanging code for token...');
        const shortToken = await exchangeCodeForToken(code, redirect_uri);
        
        console.log('Getting long-lived token...');
        const longLivedToken = await getLongLivedToken(shortToken);
        
        console.log('Fetching user profile...');
        const userProfile = await fetchUserProfile(longLivedToken.access_token);
        
        console.log('Fetching pages...');
        const pages = await fetchPages(longLivedToken.access_token);
        
        console.log('Fetching ad accounts...');
        const adAccounts = await fetchAdAccounts(longLivedToken.access_token);
        
        console.log('Saving connection data...');
        await saveConnectionData(
          supabase,
          user.id,
          userProfile,
          longLivedToken,
          pages,
          adAccounts
        );

        return new Response(JSON.stringify({
          success: true,
          message: 'Facebook connection successful',
          data: {
            pagesCount: pages.data.length,
            adAccountsCount: adAccounts.data.length,
            userProfile: {
              id: userProfile.id,
              name: userProfile.name
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'saveSelectedPages': {
        const { selectedPages, userToken } = requestBody || {};

        if (!selectedPages || !Array.isArray(selectedPages)) {
          return new Response(
            JSON.stringify({ error: 'Selected pages data is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Saving selected pages:', selectedPages.length);

        // Save each selected page
        for (const page of selectedPages) {
          await saveConnectionData(
            supabase,
            user.id,
            {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email || ''
            },
            { access_token: userToken },
            { data: [page] }, // Single page in array format
            { data: [] } // No ad accounts for page selection
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully connected ${selectedPages.length} page(s)` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Use getAuthUrl, getPages, handleCallback, or saveSelectedPages' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});