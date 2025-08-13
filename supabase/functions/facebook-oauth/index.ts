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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    const requestBody = await req.json()
    const { action, code, state } = requestBody

    // Input validation
    if (!action || typeof action !== 'string') {
      throw new Error('Invalid action parameter')
    }

    // Validate action is one of expected values
    if (!['getAuthUrl', 'handleCallback'].includes(action)) {
      throw new Error('Invalid action value')
    }

    // Additional validation for handleCallback
    if (action === 'handleCallback') {
      if (!code || typeof code !== 'string' || code.length > 512) {
        throw new Error('Invalid authorization code')
      }
      if (state && (typeof state !== 'string' || state.length > 1024)) {
        throw new Error('Invalid state parameter')
      }
    }

    if (action === 'getAuthUrl') {
      // Generate Facebook OAuth URL
      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      if (!facebookAppId) {
        throw new Error('Facebook App ID not configured')
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-oauth`
      const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement'
      const stateParam = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }))
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${facebookAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${stateParam}`

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'handleCallback' && code) {
      // Validate state parameter if provided  
      let decodedState = null
      if (state) {
        try {
          decodedState = JSON.parse(atob(state))
          if (decodedState.userId !== user.id) {
            throw new Error('State parameter validation failed')
          }
          // Check timestamp to prevent replay attacks (valid for 1 hour)
          const stateTimestamp = decodedState.timestamp
          if (!stateTimestamp || Date.now() - stateTimestamp > 3600000) {
            throw new Error('State parameter expired')
          }
        } catch (e) {
          console.error('State validation error:', e)
          throw new Error('Invalid state parameter format')
        }
      }

      // Exchange code for access token
      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')
      
      if (!facebookAppId || !facebookAppSecret) {
        throw new Error('Facebook credentials not configured')
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-oauth`
      
      // Get access token with timeout and error handling
      const tokenController = new AbortController()
      const tokenTimeout = setTimeout(() => tokenController.abort(), 10000) // 10 second timeout
      
      try {
        const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
          `client_id=${facebookAppId}&` +
          `client_secret=${facebookAppSecret}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`, {
            signal: tokenController.signal
          })
        
        clearTimeout(tokenTimeout)
        
        if (!tokenResponse.ok) {
          throw new Error(`Facebook API responded with status: ${tokenResponse.status}`)
        }
        
        const tokenData = await tokenResponse.json()
        
        if (tokenData.error) {
          console.error('Facebook OAuth error:', tokenData.error)
          throw new Error(`Facebook OAuth error: ${tokenData.error.message}`)
        }

        // Validate token response
        if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
          throw new Error('Invalid access token received from Facebook')
        }
      } catch (error) {
        clearTimeout(tokenTimeout)
        if (error.name === 'AbortError') {
          throw new Error('Facebook API request timeout')
        }
        throw error
      }

      // Get long-lived user access token
      const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${facebookAppId}&` +
        `client_secret=${facebookAppSecret}&` +
        `fb_exchange_token=${tokenData.access_token}`)
      
      const longLivedData = await longLivedResponse.json()
      const userAccessToken = longLivedData.access_token || tokenData.access_token

      // Get user info
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`)
      const userData = await userResponse.json()

      // Get user's pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`)
      const pagesData = await pagesResponse.json()

      // Store connections for each page
      const connections = []
      if (pagesData.data) {
        for (const page of pagesData.data) {
          const { data: existingConnection } = await supabase
            .from('social_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'facebook')
            .eq('page_id', page.id)
            .maybeSingle()

          // Validate required Facebook data
          if (!userData.id || !userData.name || !page.id || !page.name || !page.access_token) {
            console.error('Missing required Facebook data for page:', page.id)
            continue
          }

          // Sanitize data before storage
          const connectionData = {
            user_id: user.id,
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

      return new Response(JSON.stringify({ 
        success: true, 
        user: userData,
        pages: connections 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Facebook OAuth error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})