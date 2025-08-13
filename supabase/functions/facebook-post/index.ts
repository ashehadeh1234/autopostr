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
    const { pageId, message, imageUrl, linkUrl } = requestBody

    // Input validation
    if (!pageId || typeof pageId !== 'string' || pageId.length > 255) {
      throw new Error('Invalid page ID')
    }

    if (message && (typeof message !== 'string' || message.length > 63206)) {
      throw new Error('Message too long (max 63,206 characters)')
    }

    if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.length > 2000)) {
      throw new Error('Invalid image URL')
    }

    if (linkUrl && (typeof linkUrl !== 'string' || linkUrl.length > 2000)) {
      throw new Error('Invalid link URL')
    }

    // Validate URL format for imageUrl and linkUrl
    if (imageUrl) {
      try {
        new URL(imageUrl)
      } catch {
        throw new Error('Invalid image URL format')
      }
    }

    if (linkUrl) {
      try {
        new URL(linkUrl)
      } catch {
        throw new Error('Invalid link URL format')
      }
    }

    // At least one content type must be provided
    if (!message && !imageUrl && !linkUrl) {
      throw new Error('At least one content type (message, image, or link) must be provided')
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

    // Check if token is expired (with 5 minute buffer)
    if (connection.token_expires_at) {
      const expirationTime = new Date(connection.token_expires_at).getTime()
      const currentTime = Date.now()
      const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
      
      if (expirationTime - bufferTime < currentTime) {
        throw new Error('Facebook access token has expired. Please reconnect your account.')
      }
    }

    // Prepare post data with sanitization
    const postData: any = {
      access_token: connection.page_access_token
    }

    if (message) {
      // Sanitize message content (remove potential harmful characters)
      postData.message = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
    }

    // Add image if provided
    if (imageUrl) {
      postData.url = imageUrl
    }

    // Add link if provided
    if (linkUrl) {
      postData.link = linkUrl
    }

    // Add request timeout and abort controller
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let result: any
    try {
      // Post to Facebook
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Facebook API error:', errorData)
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      result = await response.json()

      // Validate response format
      if (!result.id) {
        throw new Error('Invalid response from Facebook API')
      }

      // Log successful post (without sensitive data)
      console.log(`Successfully posted to Facebook page ${connection.page_name} (${pageId}):`, { postId: result.id })
    } catch (error) {
      clearTimeout(timeout)
      if (error.name === 'AbortError') {
        throw new Error('Facebook API request timeout')
      }
      throw error
    }

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