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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    console.log('Exchanging user token for user:', user.id)

    // Get user's Facebook token from Supabase session
    const { data: session } = await supabase.auth.getSession()
    const providerToken = session?.session?.provider_token

    if (!providerToken) {
      throw new Error('No Facebook provider token found')
    }

    const appId = Deno.env.get('FACEBOOK_APP_ID')!
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET')!

    // Exchange for long-lived user token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${providerToken}`
    
    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(`Facebook token exchange failed: ${JSON.stringify(tokenData)}`)
    }

    console.log('Successfully exchanged token')

    return new Response(JSON.stringify({ 
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Token exchange error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to exchange token',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})