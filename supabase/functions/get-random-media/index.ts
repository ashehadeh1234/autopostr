import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user_id from query params or request body
    const url = new URL(req.url)
    const userIdFromQuery = url.searchParams.get('user_id')
    
    let userId = userIdFromQuery
    
    // If user_id not in query, try to get it from request body
    if (!userId && req.method === 'POST') {
      try {
        const body = await req.json()
        userId = body.user_id
      } catch (e) {
        // Body parsing failed, continue with query param approach
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'user_id is required as query parameter or in request body',
          example: 'GET /get-random-media?user_id=your-user-id or POST with {"user_id": "your-user-id"}'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Getting random media for user: ${userId}`)

    // Call the database function to get random media
    const { data, error } = await supabase
      .rpc('get_random_media_asset', { p_user_id: userId })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch random media', details: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No media assets found',
          suggestion: 'Upload some images or videos to your library first'
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const randomAsset = data[0]
    
    console.log(`Returning random asset: ${randomAsset.name}`)

    return new Response(
      JSON.stringify({
        asset: randomAsset,
        message: 'Random media asset retrieved successfully',
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-random-media function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})