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

    const { access_token } = await req.json()

    if (!access_token) {
      throw new Error('Missing access token')
    }

    console.log('Fetching Facebook pages for user:', user.id)

    // Get user's Facebook pages
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,instagram_business_account&access_token=${access_token}`
    
    const pagesResponse = await fetch(pagesUrl)
    const pagesData = await pagesResponse.json()

    if (!pagesResponse.ok) {
      throw new Error(`Facebook pages fetch failed: ${JSON.stringify(pagesData)}`)
    }

    console.log('Successfully fetched pages:', pagesData.data?.length || 0)

    return new Response(JSON.stringify({ 
      success: true,
      pages: pagesData.data || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Pages fetch error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch pages',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})