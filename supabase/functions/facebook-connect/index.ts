import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SCOPES = "pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,public_profile,instagram_basic,instagram_content_publish";

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
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

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    console.log('=== Facebook Connect Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    const url = new URL(req.url);
    const route = url.pathname.split("/").slice(-1)[0]; // "authorize" | "callback"
    
    console.log('Route:', route);

    const APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!APP_ID || !APP_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing environment variables:', { APP_ID: !!APP_ID, APP_SECRET: !!APP_SECRET, SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY });
      return json({ error: "Missing environment variables" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const redirectUri = `${SUPABASE_URL}/functions/v1/facebook-connect/callback`;

    if (route === "authorize") {
      const authHeader = req.headers.get('Authorization');
      const user = await validateUser(supabase, authHeader);
      
      const state = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", APP_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("state", state);
      
      console.log('Generated auth URL:', authUrl.toString());
      return json({ authorize_url: authUrl.toString(), state }, 200);
    }

    if (route === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const err = url.searchParams.get("error");
      
      if (err) {
        console.error('Facebook OAuth error:', err);
        return json({ error: `Facebook error: ${err}` }, 400);
      }
      
      if (!code) {
        console.error('Missing code parameter');
        return json({ error: "Missing code" }, 400);
      }

      if (!state) {
        console.error('Missing state parameter');
        return json({ error: "Missing state parameter" }, 400);
      }

      console.log('Processing callback with code and state');

      // 1) Exchange code for short-lived user token
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${APP_SECRET}&code=${code}`;
      
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();
      
      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokenData);
        return json({ error: "Token exchange failed", details: tokenData }, 502);
      }
      
      const userToken = tokenData.access_token;
      console.log('Got user token');

      // 2) Exchange for long-lived user token
      const longTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`;
      
      const longRes = await fetch(longTokenUrl);
      const longData = await longRes.json();
      const stableUserToken = longRes.ok && longData.access_token ? longData.access_token : userToken;
      
      console.log('Got long-lived token');

      // 3) Fetch Pages the user manages
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${stableUserToken}`);
      const pagesData = await pagesRes.json();
      
      if (!pagesRes.ok) {
        console.error("Fetching pages failed:", pagesData);
        return json({ error: "Failed to fetch pages", details: pagesData }, 502);
      }

      const pages: any[] = [];
      const igAccounts: any[] = [];

      if (Array.isArray(pagesData.data)) {
        console.log(`Found ${pagesData.data.length} pages`);
        
        for (const p of pagesData.data) {
          const page = { id: p.id, name: p.name, access_token: p.access_token };
          pages.push(page);

          // 4) For each page, find connected IG business account
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v19.0/${p.id}?fields=instagram_business_account{username,id}&access_token=${p.access_token}`
            );
            const igData = await igRes.json();
            const iba = igData?.instagram_business_account;
            
            if (iba?.id) {
              igAccounts.push({
                ig_user_id: iba.id,
                username: iba.username || "",
                page_id: p.id,
                page_name: p.name,
                page_access_token: p.access_token,
              });
              console.log(`Found IG account for page ${p.name}: ${iba.username}`);
            }
          } catch (igError) {
            console.warn(`No Instagram account found for page ${p.name}:`, igError);
          }
        }
      }

      console.log(`Returning ${pages.length} pages and ${igAccounts.length} IG accounts`);
      return json({ 
        ok: true, 
        pages, 
        ig_accounts: igAccounts,
        state 
      }, 200);
    }

    // Handle save-connections route
    if (route === "save-connections" && req.method === "POST") {
      const authHeader = req.headers.get('Authorization');
      const user = await validateUser(supabase, authHeader);
      
      const body = await req.json();
      console.log('Saving connections for user:', user.id);
      
      const rows: any[] = [];

      // Add Facebook pages
      (body.pages ?? []).forEach((p: any) => {
        rows.push({
          user_id: user.id, 
          provider: "facebook",
          external_id: p.id, 
          name: p.name,
          access_token: p.access_token, 
          meta: { page_id: p.id }
        });
      });

      // Add Instagram accounts
      (body.ig_accounts ?? []).forEach((ig: any) => {
        rows.push({
          user_id: user.id, 
          provider: "instagram",
          external_id: ig.ig_user_id, 
          name: ig.username || ig.ig_user_id,
          access_token: ig.page_access_token,
          meta: { 
            page_id: ig.page_id, 
            page_name: ig.page_name, 
            ig_user_id: ig.ig_user_id 
          }
        });
      });

      if (!rows.length) {
        return json({ error: "No selections provided" }, 400);
      }

      console.log(`Inserting ${rows.length} connections`);
      
      const { error } = await supabase
        .from("social_connections")
        .upsert(rows, { onConflict: "user_id,provider,external_id" });
        
      if (error) {
        console.error('Database error:', error);
        return json({ error: error.message }, 500);
      }

      console.log('Successfully saved connections');
      return json({ ok: true, saved: rows.length }, 200);
    }

    return json({ error: "Route not found" }, 404);
    
  } catch (e) {
    console.error("Edge Function error:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});