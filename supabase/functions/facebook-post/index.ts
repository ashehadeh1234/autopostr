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

    const { pageId, message, imageUrl, linkUrl } = await req.json()

    if (!pageId || !message) {
      throw new Error('Page ID and message are required')
    }

    // Get the connection for this page
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .eq('page_id', pageId)
      .eq('is_active', true)
      .maybeSingle()

    if (connectionError || !connection) {
      throw new Error('Facebook page connection not found or inactive')
    }

    // Check if token is expired
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      throw new Error('Facebook access token has expired. Please reconnect your account.')
    }

    // Prepare post data
    const postData: any = {
      message: message,
      access_token: connection.page_access_token
    }

    // Add image if provided
    if (imageUrl) {
      postData.url = imageUrl
    }

    // Add link if provided
    if (linkUrl) {
      postData.link = linkUrl
    }

    // Post to Facebook
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    })

    const result = await response.json()

    if (result.error) {
      throw new Error(`Facebook API error: ${result.error.message}`)
    }

    // Log successful post
    console.log(`Successfully posted to Facebook page ${connection.page_name} (${pageId}):`, result)

    return new Response(JSON.stringify({ 
      success: true,
      postId: result.id,
      pageId: pageId,
      pageName: connection.page_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Facebook post error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})