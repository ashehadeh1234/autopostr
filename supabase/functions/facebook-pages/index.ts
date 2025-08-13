import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's Facebook provider token
    const { data: identities } = await supabase.auth.getUserIdentities()
    const facebookIdentity = identities?.identities?.find(
      (identity) => identity.provider === 'facebook'
    )

    if (!facebookIdentity) {
      return new Response(JSON.stringify({ error: 'No Facebook connection found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = facebookIdentity.identity_data?.provider_token
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No access token found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Fetching Facebook pages for user:', user.id)

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,perms,tasks&access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()

    console.log('Pages response status:', pagesResponse.status)
    console.log('Pages data:', JSON.stringify(pagesData, null, 2))

    if (pagesData.error) {
      console.error('Facebook API error:', pagesData.error)
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pages = pagesData.data || []
    console.log(`Found ${pages.length} pages for user`)

    // Save each page as a social connection
    for (const page of pages) {
      console.log(`Processing page: ${page.name} (${page.id})`)
      
      const pagePermissions = page.perms || []
      const pageTasks = page.tasks || []
      
      // Combine permissions and tasks for comprehensive access info
      const allPermissions = [...pagePermissions, ...pageTasks]
      
      const { error: insertError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'facebook',
          platform_user_id: user.id,
          platform_username: user.user_metadata?.full_name || 'Facebook User',
          page_id: page.id,
          page_name: page.name,
          access_token: accessToken,
          page_access_token: page.access_token,
          permissions: allPermissions,
          is_active: true
        }, {
          onConflict: 'user_id,platform,page_id'
        })

      if (insertError) {
        console.error('Error saving page connection:', insertError)
      } else {
        console.log(`Saved connection for page: ${page.name}`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      pages: pages.map(p => ({ id: p.id, name: p.name }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})