import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[${requestId}] Facebook OAuth request started:`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

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
      console.error(`[${requestId}] Missing Authorization header`)
      throw new Error('Missing Authorization header')
    }

    console.log(`[${requestId}] Validating user token...`)
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error(`[${requestId}] Auth validation failed:`, authError)
      throw new Error('Invalid or expired token')
    }

    console.log(`[${requestId}] User authenticated:`, user.id)

    const requestBody = await req.json()
    const { action, code, state } = requestBody

    console.log(`[${requestId}] Processing action:`, action)

    // Input validation
    if (!action || typeof action !== 'string') {
      console.error(`[${requestId}] Invalid action parameter:`, action)
      throw new Error('Invalid action parameter')
    }

    // Validate action is one of expected values
    if (!['getAuthUrl', 'handleCallback'].includes(action)) {
      console.error(`[${requestId}] Invalid action value:`, action)
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
      console.log(`[${requestId}] Generating Facebook OAuth URL...`)
      
      // Generate Facebook OAuth URL
      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      if (!facebookAppId) {
        console.error(`[${requestId}] Facebook App ID not configured`)
        throw new Error('Facebook App ID not configured')
      }

      const redirectUri = `https://e9e888a3-548a-4ec5-b629-c611095423bc.lovableproject.com/facebook-callback.html`
      const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement'
      const stateParam = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now(), requestId }))
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${facebookAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${stateParam}`

      console.log(`[${requestId}] OAuth URL generated successfully`)
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'handleCallback' && code) {
      console.log(`[${requestId}] Processing callback with code:`, code.slice(0, 10) + '...')
      
      // Validate state parameter if provided  
      let decodedState = null
      if (state) {
        try {
          decodedState = JSON.parse(atob(state))
          console.log(`[${requestId}] State validation - User ID match:`, decodedState.userId === user.id)
          
          if (decodedState.userId !== user.id) {
            console.error(`[${requestId}] State validation failed - user mismatch`)
            throw new Error('State parameter validation failed')
          }
          
          // Check timestamp to prevent replay attacks (valid for 1 hour)
          const stateTimestamp = decodedState.timestamp
          if (!stateTimestamp || Date.now() - stateTimestamp > 3600000) {
            console.error(`[${requestId}] State parameter expired`)
            throw new Error('State parameter expired')
          }
        } catch (e) {
          console.error(`[${requestId}] State validation error:`, e)
          throw new Error('Invalid state parameter format')
        }
      }

      // Exchange code for access token
      console.log(`[${requestId}] Exchanging code for access token...`)
      
      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')
      
      if (!facebookAppId || !facebookAppSecret) {
        console.error(`[${requestId}] Facebook credentials not configured`)
        throw new Error('Facebook credentials not configured')
      }

      const redirectUri = `https://e9e888a3-548a-4ec5-b629-c611095423bc.lovableproject.com/facebook-callback.html`
      
      // Get access token with timeout and error handling
      const tokenController = new AbortController()
      const tokenTimeout = setTimeout(() => tokenController.abort(), 10000) // 10 second timeout
      let tokenData = null // Move declaration outside try-catch block
      
      try {
        console.log(`[${requestId}] Requesting access token from Facebook...`)
        const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
          `client_id=${facebookAppId}&` +
          `client_secret=${facebookAppSecret}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`, {
            signal: tokenController.signal
          })
        
        clearTimeout(tokenTimeout)
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error(`[${requestId}] Facebook token request failed:`, {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: errorText
          })
          throw new Error(`Facebook API responded with status: ${tokenResponse.status} - ${errorText}`)
        }
        
        tokenData = await tokenResponse.json()
        console.log(`[${requestId}] Token response received from Facebook`)
        
        if (tokenData.error) {
          console.error(`[${requestId}] Facebook OAuth error:`, tokenData.error)
          throw new Error(`Facebook OAuth error: ${tokenData.error.message || tokenData.error}`)
        }

        // Validate token response
        if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
          console.error(`[${requestId}] Invalid token data received:`, tokenData)
          throw new Error('Invalid access token received from Facebook')
        }
        
        console.log(`[${requestId}] Successfully obtained access token`)
      } catch (error) {
        clearTimeout(tokenTimeout)
        console.error(`[${requestId}] Token exchange error:`, error.message)
        if (error.name === 'AbortError') {
          throw new Error('Facebook API request timeout')
        }
        throw error
      }

      // Get long-lived user access token
      console.log(`[${requestId}] Exchanging for long-lived token...`)
      const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${facebookAppId}&` +
        `client_secret=${facebookAppSecret}&` +
        `fb_exchange_token=${tokenData.access_token}`)
      
      if (!longLivedResponse.ok) {
        console.warn(`[${requestId}] Long-lived token exchange failed, using original token`)
      }
      
      const longLivedData = await longLivedResponse.json()
      const userAccessToken = longLivedData.access_token || tokenData.access_token
      console.log(`[${requestId}] Using ${longLivedData.access_token ? 'long-lived' : 'original'} access token`)

      // Get user info
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`)
      const userData = await userResponse.json()

      // Get user's pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`)
      const pagesData = await pagesResponse.json()

      // Store connections for each page
      console.log(`[${requestId}] Processing ${pagesData.data?.length || 0} pages...`)
      
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

      console.log(`[${requestId}] Successfully processed ${connections.length} page connections`)
      
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
    console.error(`[${requestId}] Facebook OAuth error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(JSON.stringify({ 
      error: error.message,
      requestId: requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})