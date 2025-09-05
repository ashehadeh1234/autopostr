import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FB_VER = "v23.0";
const FB_BASE = `https://graph.facebook.com/${FB_VER}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const authHeader = req.headers.get('authorization');
    
    if (!code) {
      throw new Error('Authorization code missing');
    }

    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const appId = Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');
    const redirectUri = `${req.headers.get('origin')}/app/connections?fb_callback=true`;

    if (!appId || !appSecret) {
      throw new Error('Facebook app credentials not configured');
    }

    console.log('Processing Facebook callback for user:', user.id);

    // 1) Exchange code for short-lived token
    const tokenRes = await fetch(
      `${FB_BASE}/oauth/access_token` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${appSecret}` +
        `&code=${encodeURIComponent(code)}`
    );
    
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error('FB short-lived token error:', tokenJson);
      throw new Error('Failed to exchange code for token');
    }
    
    const shortToken = tokenJson.access_token;

    // 2) Exchange for long-lived token (~60 days)
    const llRes = await fetch(
      `${FB_BASE}/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&fb_exchange_token=${encodeURIComponent(shortToken)}`
    );
    
    const llJson = await llRes.json();
    if (!llRes.ok || !llJson.access_token) {
      console.error('FB long-lived token error:', llJson);
      throw new Error('Failed to get long-lived token');
    }
    
    const longToken = llJson.access_token;
    const expiresIn = llJson.expires_in;

    // 3) Get user info
    const meRes = await fetch(`${FB_BASE}/me?access_token=${encodeURIComponent(longToken)}`);
    const meJson = await meRes.json();
    
    if (!meRes.ok) {
      console.error('FB user info error:', meJson);
      throw new Error('Failed to get user info');
    }

    // 4) Get user's pages
    const pagesRes = await fetch(`${FB_BASE}/me/accounts?access_token=${encodeURIComponent(longToken)}`);
    const pagesJson = await pagesRes.json();
    
    if (!pagesRes.ok) {
      console.error('FB pages error:', pagesJson);
      throw new Error('Failed to get pages');
    }

    console.log('Facebook connection successful:', {
      userId: user.id,
      fbUserId: meJson.id,
      pagesCount: pagesJson.data?.length || 0,
      tokenLength: longToken.length,
      expiresIn
    });

    // Calculate expiry date
    const expiresAt = expiresIn ? new Date(Date.now() + (expiresIn * 1000)).toISOString() : null;

    // 5) Store connection in database
    const { error: connectionError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: 'facebook',
        platform_user_id: meJson.id,
        platform_username: meJson.name,
        access_token_encrypted: longToken, // This will be encrypted by the database function
        token_expires_at: expiresAt,
        is_active: true,
        permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
      }, {
        onConflict: 'user_id,platform'
      });

    if (connectionError) {
      console.error('Database error:', connectionError);
      throw new Error('Failed to save connection');
    }

    // 6) Store pages if any
    if (pagesJson.data && pagesJson.data.length > 0) {
      for (const page of pagesJson.data) {
        const { error: pageError } = await supabase
          .from('fb_pages')
          .upsert({
            user_id: user.id,
            page_id: page.id,
            name: page.name,
            page_access_token_encrypted: page.access_token, // This will be encrypted by the database function
            is_default: false
          }, {
            onConflict: 'user_id,page_id'
          });

        if (pageError) {
          console.error('Page save error:', pageError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Facebook connected successfully',
      pages: pagesJson.data?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Facebook callback error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})