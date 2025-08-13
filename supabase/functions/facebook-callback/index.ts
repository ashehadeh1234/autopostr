import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    console.log('Facebook callback received:', { code: !!code, state: !!state, error })

    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription)
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Facebook Connection Failed</title></head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: '${errorDescription || error}'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Facebook Connection Failed</title></head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: 'Missing authorization code or state'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Validate state parameter
    let decodedState = null
    try {
      decodedState = JSON.parse(atob(state))
      console.log('Decoded state:', decodedState)
    } catch (e) {
      console.error('State validation error:', e)
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Facebook Connection Failed</title></head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: 'Invalid state parameter'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Exchange code for access token
    const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
    const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')
    
    if (!facebookAppId || !facebookAppSecret) {
      throw new Error('Facebook credentials not configured')
    }

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-callback`
    
    console.log('Exchanging code for token with:', { facebookAppId, redirectUri })
    
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${facebookAppId}&` +
      `client_secret=${facebookAppSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`)
    
    const tokenData = await tokenResponse.json()
    console.log('Token response:', tokenData)
    
    if (tokenData.error) {
      console.error('Facebook OAuth error:', tokenData.error)
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Facebook Connection Failed</title></head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: '${tokenData.error.message}'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Get long-lived user access token
    console.log('Requesting long-lived token...')
    const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${facebookAppId}&` +
      `client_secret=${facebookAppSecret}&` +
      `fb_exchange_token=${tokenData.access_token}`)
    
    const longLivedData = await longLivedResponse.json()
    console.log('Long-lived token response:', longLivedData)
    
    if (longLivedData.error) {
      console.error('Long-lived token error:', longLivedData.error)
    }
    
    const userAccessToken = longLivedData.access_token || tokenData.access_token
    console.log('Using access token (first 20 chars):', userAccessToken.substring(0, 20) + '...')

    // Get user info with detailed fields
    console.log('Fetching user data...')
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${userAccessToken}`)
    const userData = await userResponse.json()
    console.log('User API response status:', userResponse.status)
    console.log('User data response:', userData)
    
    if (userData.error) {
      console.error('User data error:', userData.error)
    }

    // Get user's pages with detailed debugging
    console.log('Fetching pages data...')
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,perms,tasks&access_token=${userAccessToken}`)
    const pagesData = await pagesResponse.json()
    
    console.log('Pages API response status:', pagesResponse.status)
    console.log('Pages API response headers:', Object.fromEntries(pagesResponse.headers))
    console.log('Full pages response:', JSON.stringify(pagesData, null, 2))
    
    if (pagesData.error) {
      console.error('Pages API error:', pagesData.error)
      console.error('Error details:', {
        message: pagesData.error.message,
        type: pagesData.error.type,
        code: pagesData.error.code,
        error_subcode: pagesData.error.error_subcode,
        fbtrace_id: pagesData.error.fbtrace_id
      })
    }
    
    // Check if pages array exists and its length
    if (pagesData.data) {
      console.log('Pages found:', pagesData.data.length)
      pagesData.data.forEach((page, index) => {
        console.log(`Page ${index + 1}:`, {
          id: page.id,
          name: page.name,
          hasAccessToken: !!page.access_token,
          permissions: page.perms || [],
          tasks: page.tasks || []
        })
      })
    } else {
      console.log('No pages data array found in response')
    }

    console.log('User data:', userData)
    console.log('Pages data summary:', { 
      hasData: !!pagesData.data, 
      pageCount: pagesData.data?.length || 0,
      error: pagesData.error ? 'YES' : 'NO'
    })

    // Store connections for each page
    const connections = []
    if (pagesData.data) {
      for (const page of pagesData.data) {
        const { data: existingConnection } = await supabase
          .from('social_connections')
          .select('*')
          .eq('user_id', decodedState.userId)
          .eq('platform', 'facebook')
          .eq('page_id', page.id)
          .maybeSingle()

        const connectionData = {
          user_id: decodedState.userId,
          platform: 'facebook',
          platform_user_id: String(userData.id).substring(0, 255),
          platform_username: String(userData.name).substring(0, 255),
          access_token: userAccessToken,
          page_id: String(page.id).substring(0, 255),
          page_name: String(page.name).substring(0, 255),
          page_access_token: page.access_token,
          token_expires_at: longLivedData.expires_in ? 
            new Date(Date.now() + longLivedData.expires_in * 1000).toISOString() : null,
          permissions: Array.isArray(page.perms) ? page.perms.slice(0, 20) : [],
          is_active: true
        }

        if (existingConnection) {
          const { error } = await supabase
            .from('social_connections')
            .update(connectionData)
            .eq('id', existingConnection.id)
          
          if (error) {
            console.error('Error updating connection:', error)
          }
        } else {
          const { error } = await supabase
            .from('social_connections')
            .insert(connectionData)
          
          if (error) {
            console.error('Error creating connection:', error)
          }
        }
        
        connections.push({
          pageId: page.id,
          pageName: page.name,
          permissions: page.perms || []
        })
      }
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Facebook Connected Successfully</title></head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2>Successfully connected to Facebook!</h2>
          <p>You can close this window.</p>
        </div>
        <script>
          window.opener?.postMessage({
            type: 'FACEBOOK_OAUTH_SUCCESS',
            user: ${JSON.stringify(userData)},
            pages: ${JSON.stringify(connections)}
          }, '${url.origin}');
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Facebook callback error:', error)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Facebook Connection Failed</title></head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'FACEBOOK_OAUTH_ERROR',
            error: '${error.message}'
          }, window.location.origin);
          window.close();
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})