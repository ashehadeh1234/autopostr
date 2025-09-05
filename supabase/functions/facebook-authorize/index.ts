import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('META_APP_ID');
    if (!appId) {
      throw new Error('META_APP_ID not configured');
    }

    const redirectUri = encodeURIComponent(`${req.headers.get('origin')}/api/facebook/callback`);

    // Facebook Pages permissions (includes Instagram basic access via connected pages)
    const scope = [
      "pages_manage_posts",
      "pages_read_engagement", 
      "pages_show_list",
      "pages_read_user_content",
      "pages_manage_engagement",
      "pages_manage_metadata",
      "read_insights",
      "instagram_basic",
      "instagram_content_publish"
    ].join(",");

    const authUrl = 
      `https://www.facebook.com/v23.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=fb_connect`;

    console.log('Facebook OAuth URL generated:', authUrl);

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Facebook authorize error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})