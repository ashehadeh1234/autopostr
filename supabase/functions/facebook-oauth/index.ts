import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= AUTH HELPERS =============
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function validateUser(authHeader: string | null, supabase: any, requestId: string) {
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
  return user
}

// ============= FACEBOOK AUTH URL =============
function getAuthUrl(user: any, requestId: string): string {
  console.log(`[${requestId}] Generating Facebook OAuth URL for user: ${user.id}`)
  
  const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
  if (!facebookAppId) {
    console.error(`[${requestId}] Facebook App ID not configured`)
    throw new Error('Facebook App ID not configured')
  }

  const redirectUri = `https://e9e888a3-548a-4ec5-b629-c611095423bc.lovableproject.com/facebook-callback.html`
  const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement'
  const stateParam = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now(), requestId }))
  
  console.log(`[${requestId}] Using redirect URI: ${redirectUri}`)
  console.log(`[${requestId}] Using scope: ${scope}`)
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${facebookAppId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${stateParam}`

  console.log(`[${requestId}] OAuth URL generated successfully`)
  return authUrl
}

// ============= STATE VALIDATION =============
function validateState(state: string | null, user: any, requestId: string) {
  if (!state) return null

  try {
    const decodedState = JSON.parse(atob(state))
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

    return decodedState
  } catch (e) {
    console.error(`[${requestId}] State validation error:`, e)
    throw new Error('Invalid state parameter format')
  }
}

// ============= TOKEN EXCHANGE =============
async function exchangeCodeForToken(code: string, requestId: string): Promise<string> {
  console.log(`[${requestId}] Exchanging code for access token...`)
  
  const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
  const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')
  
  if (!facebookAppId || !facebookAppSecret) {
    console.error(`[${requestId}] Facebook credentials not configured`)
    throw new Error('Facebook credentials not configured')
  }

  const redirectUri = `https://e9e888a3-548a-4ec5-b629-c611095423bc.lovableproject.com/facebook-callback.html`
  
  console.log(`[${requestId}] Using redirect URI for token exchange: ${redirectUri}`)
  
  // Get access token with timeout
  const tokenController = new AbortController()
  const tokenTimeout = setTimeout(() => tokenController.abort(), 10000)
  
  try {
    console.log(`[${requestId}] Requesting access token from Facebook...`)
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${facebookAppId}&` +
      `client_secret=${facebookAppSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    
    console.log(`[${requestId}] Token request URL (without secrets): ${tokenUrl.replace(facebookAppSecret, '[REDACTED]')}`)
    
    const tokenResponse = await fetch(tokenUrl, {
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
    
    const tokenData = await tokenResponse.json()
    console.log(`[${requestId}] Token response received from Facebook`)
    
    if (tokenData.error) {
      console.error(`[${requestId}] Facebook OAuth error:`, tokenData.error)
      throw new Error(`Facebook OAuth error: ${tokenData.error.message || tokenData.error}`)
    }

    if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
      console.error(`[${requestId}] Invalid token data received:`, tokenData)
      throw new Error('Invalid access token received from Facebook')
    }
    
    console.log(`[${requestId}] Successfully obtained access token`)
    return tokenData.access_token
  } catch (error) {
    clearTimeout(tokenTimeout)
    console.error(`[${requestId}] Token exchange error:`, error.message)
    if (error.name === 'AbortError') {
      throw new Error('Facebook API request timeout')
    }
    throw error
  }
}

// ============= LONG-LIVED TOKEN =============
async function getLongLivedToken(shortToken: string, requestId: string): Promise<{ token: string, expiresIn?: number }> {
  console.log(`[${requestId}] Exchanging for long-lived token...`)
  
  const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
  const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')

  try {
    const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${facebookAppId}&` +
      `client_secret=${facebookAppSecret}&` +
      `fb_exchange_token=${shortToken}`)
    
    if (!longLivedResponse.ok) {
      console.warn(`[${requestId}] Long-lived token exchange failed, using original token`)
      return { token: shortToken }
    }
    
    const longLivedData = await longLivedResponse.json()
    const token = longLivedData.access_token || shortToken
    console.log(`[${requestId}] Using ${longLivedData.access_token ? 'long-lived' : 'original'} access token`)
    
    return { token, expiresIn: longLivedData.expires_in }
  } catch (error) {
    console.warn(`[${requestId}] Long-lived token exchange error, using original:`, error)
    return { token: shortToken }
  }
}

// ============= FACEBOOK DATA FETCHING =============
async function fetchFacebookData(userAccessToken: string, requestId: string) {
  console.log(`[${requestId}] Fetching Facebook user and pages data`)
  
  // Get user info
  const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`)
  if (!userResponse.ok) {
    throw new Error(`Failed to fetch user data: ${userResponse.statusText}`)
  }
  const userData = await userResponse.json()
  console.log(`[${requestId}] User data fetched: ${userData.id}`)

  // Get user's pages with Instagram business accounts
  const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`)
  if (!pagesResponse.ok) {
    throw new Error(`Failed to fetch pages data: ${pagesResponse.statusText}`)
  }
  const pagesData = await pagesResponse.json()
  console.log(`[${requestId}] Pages data fetched: ${pagesData.data?.length || 0} pages`)

  return { user: userData, pages: pagesData.data || [] }
}

// ============= DATABASE OPERATIONS =============
async function saveConnections(user: any, userData: any, pagesData: any, userAccessToken: string, expiresIn: number | undefined, supabase: any, requestId: string) {
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
        token_expires_at: expiresIn ? 
          new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        permissions: Array.isArray(page.perms) ? page.perms.slice(0, 20) : [],
        is_active: true
      }

      if (existingConnection) {
        console.log(`[${requestId}] Updating existing connection for page: ${page.name}`)
        const { data, error } = await supabase
          .from('social_connections')
          .update(connectionData)
          .eq('id', existingConnection.id)
          .select()
        
        if (error) {
          console.error(`[${requestId}] Error updating connection for ${page.name}:`, error)
          throw new Error(`Failed to update connection for ${page.name}: ${error.message}`)
        }
        
        if (!data || data.length === 0) {
          console.error(`[${requestId}] No data returned after updating connection for ${page.name}`)
          throw new Error(`Failed to confirm update for ${page.name}`)
        }
        
        console.log(`[${requestId}] Successfully updated connection for page: ${page.name}`)
      } else {
        console.log(`[${requestId}] Creating new connection for page: ${page.name}`)
        const { data, error } = await supabase
          .from('social_connections')
          .insert(connectionData)
          .select()
        
        if (error) {
          console.error(`[${requestId}] Error creating connection for ${page.name}:`, error)
          throw new Error(`Failed to create connection for ${page.name}: ${error.message}`)
        }
        
        if (!data || data.length === 0) {
          console.error(`[${requestId}] No data returned after creating connection for ${page.name}`)
          throw new Error(`Failed to confirm creation for ${page.name}`)
        }
        
        console.log(`[${requestId}] Successfully created connection for page: ${page.name}`)
      }
      
      connections.push({
        pageId: page.id,
        pageName: page.name,
        permissions: page.perms || []
      })
    }
  }

  console.log(`[${requestId}] Successfully processed ${connections.length} page connections`)
  return connections
}

// ============= MAIN FUNCTION =============
Deno.serve(async (req) => {
  const requestId = generateRequestId()
  
  console.log(`[${requestId}] Facebook OAuth request started:`, {
    method: req.method,
    url: req.url
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const user = await validateUser(req.headers.get('Authorization'), supabase, requestId)
    const requestBody = await req.json()
    const { action, code, state } = requestBody

    console.log(`[${requestId}] Processing action:`, action)

    // Input validation
    if (!action || typeof action !== 'string' || !['getAuthUrl', 'handleCallback', 'saveSelectedPages'].includes(action)) {
      throw new Error('Invalid action parameter')
    }

    if (action === 'handleCallback') {
      if (!code || typeof code !== 'string' || code.length > 512) {
        throw new Error('Invalid authorization code')
      }
      if (state && (typeof state !== 'string' || state.length > 1024)) {
        throw new Error('Invalid state parameter')
      }
    }

    if (action === 'getAuthUrl') {
      const authUrl = getAuthUrl(user, requestId)
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'handleCallback' && code) {
      console.log(`[${requestId}] Processing callback with code:`, code.slice(0, 10) + '...')
      
      // Validate state parameter
      validateState(state, user, requestId)
      
      // Exchange code for token
      const shortToken = await exchangeCodeForToken(code, requestId)
      
      // Get long-lived token
      const { token: userAccessToken, expiresIn } = await getLongLivedToken(shortToken, requestId)
      
      // Fetch Facebook data
      const { user: userData, pages } = await fetchFacebookData(userAccessToken, requestId)
      
      // Return pages for user selection instead of auto-saving
      return new Response(JSON.stringify({ 
        success: true, 
        user: userData,
        pages: pages,
        userToken: userAccessToken,
        message: `Found ${pages.length} Facebook pages available for connection.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'saveSelectedPages') {
      const { selectedPages, userToken } = requestBody
      
      console.log(`[${requestId}] Saving ${selectedPages?.length || 0} selected pages`)
      
      if (!Array.isArray(selectedPages) || !userToken) {
        throw new Error('Invalid selected pages or user token')
      }
      
      // Create mock Facebook data structure for saveConnections
      const userData = { id: user.id, name: user.email }
      const pagesData = { data: selectedPages }
      
      // Save selected pages to database
      const connections = await saveConnections(user, userData, pagesData, userToken, undefined, supabase, requestId)
      
      return new Response(JSON.stringify({ 
        success: true, 
        pages: connections,
        message: `Successfully connected ${connections.length} Facebook pages.`
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