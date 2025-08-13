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

    const { pageId, pageName, pageAccessToken, igUserId, workspaceId } = await req.json()

    if (!pageId || !pageName || !pageAccessToken || !workspaceId) {
      throw new Error('Missing required page data')
    }

    console.log('Selecting Facebook page for user:', user.id, 'page:', pageId)

    // Store page connection in database
    const { data, error } = await supabase
      .from('page_connections')
      .upsert({
        workspace_id: workspaceId,
        user_id: user.id,
        page_id: pageId,
        page_name: pageName,
        page_access_token_encrypted: pageAccessToken, // TODO: Encrypt this
        ig_user_id: igUserId || null
      })
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Successfully stored page connection')

    return new Response(JSON.stringify({ 
      success: true,
      connection: data[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Page selection error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to select page',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})