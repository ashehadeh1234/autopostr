import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPostRequest {
  page_id: string;
  message?: string;
  link?: string;
  photo_url?: string;
  video_url?: string;
  scheduled_unix?: number;
}

interface FacebookPostResponse {
  id: string;
  post_id?: string;
  scheduled_publish_time?: number;
}

const validateUser = async (supabase: any, authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
};

const getPageAccessToken = async (supabase: any, pageId: string, userId: string): Promise<string> => {
  const { data, error } = await supabase
    .rpc('get_decrypted_page_access_token', { p_page_id: pageId });
  
  if (error) {
    throw new Error(`Failed to get page token: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Page not found or access token not available');
  }
  
  return data;
};

const postToFacebook = async (
  pageAccessToken: string,
  pageId: string,
  request: FacebookPostRequest
): Promise<FacebookPostResponse> => {
  const { message, link, photo_url, video_url, scheduled_unix } = request;
  
  // Determine the posting endpoint and payload
  let endpoint: string;
  let payload: Record<string, any> = {};
  
  if (photo_url) {
    // Photo post
    endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
    payload = {
      url: photo_url,
      caption: message || '',
      access_token: pageAccessToken,
    };
  } else if (video_url) {
    // Video post
    endpoint = `https://graph.facebook.com/v18.0/${pageId}/videos`;
    payload = {
      file_url: video_url,
      description: message || '',
      access_token: pageAccessToken,
    };
  } else {
    // Text/link post
    endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    payload = {
      access_token: pageAccessToken,
    };
    
    if (message) {
      payload.message = message;
    }
    
    if (link) {
      payload.link = link;
    }
  }
  
  // Handle scheduling
  if (scheduled_unix) {
    const scheduledTime = new Date(scheduled_unix * 1000);
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    if (scheduledTime < minScheduleTime) {
      throw new Error('Scheduled time must be at least 10 minutes in the future');
    }
    
    // Facebook scheduling
    payload.published = false;
    payload.scheduled_publish_time = scheduled_unix;
  }
  
  // Make the API call
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Facebook API error: ${data.error?.message || JSON.stringify(data)}`);
  }
  
  return data;
};

const saveScheduledPost = async (
  supabase: any,
  userId: string,
  request: FacebookPostRequest,
  facebookResponse: FacebookPostResponse | null = null,
  error: string | null = null
) => {
  const postData = {
    user_id: userId,
    target_type: 'facebook_page' as const,
    target_id: request.page_id,
    message: request.message || null,
    media_url: request.photo_url || request.video_url || null,
    link_url: request.link || null,
    status: error ? 'failed' as const : (request.scheduled_unix ? 'queued' as const : 'published' as const),
    run_at: request.scheduled_unix ? new Date(request.scheduled_unix * 1000).toISOString() : new Date().toISOString(),
    published_at: (!request.scheduled_unix && !error) ? new Date().toISOString() : null,
    result_json: facebookResponse ? facebookResponse : null,
    error_message: error,
  };
  
  const { data, error: dbError } = await supabase
    .from('scheduled_posts')
    .insert(postData)
    .select()
    .single();
  
  if (dbError) {
    console.error('Failed to save scheduled post:', dbError);
  }
  
  return data;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    const user = await validateUser(supabase, authHeader);
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const request: FacebookPostRequest = await req.json();
    
    // Validate required fields
    if (!request.page_id) {
      return new Response(JSON.stringify({ error: 'page_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!request.message && !request.link && !request.photo_url && !request.video_url) {
      return new Response(JSON.stringify({ error: 'At least one of message, link, photo_url, or video_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify user owns this page
    const { data: pageData, error: pageError } = await supabase
      .from('fb_pages')
      .select('page_id')
      .eq('page_id', request.page_id)
      .eq('user_id', user.id)
      .single();
    
    if (pageError || !pageData) {
      return new Response(JSON.stringify({ error: 'Page not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let facebookResponse: FacebookPostResponse | null = null;
    let errorMessage: string | null = null;
    
    try {
      // Get page access token
      const pageAccessToken = await getPageAccessToken(supabase, request.page_id, user.id);
      
      // Post to Facebook
      facebookResponse = await postToFacebook(pageAccessToken, request.page_id, request);
      
      console.log('Facebook post successful:', facebookResponse);
      
    } catch (error) {
      console.error('Facebook posting error:', error);
      errorMessage = error.message;
    }
    
    // Save to database
    const savedPost = await saveScheduledPost(supabase, user.id, request, facebookResponse, errorMessage);
    
    if (errorMessage) {
      return new Response(JSON.stringify({ 
        error: errorMessage,
        post_id: savedPost?.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      facebook_response: facebookResponse,
      post_id: savedPost?.id,
      scheduled: !!request.scheduled_unix,
      message: request.scheduled_unix 
        ? 'Post scheduled successfully' 
        : 'Post published successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Facebook post function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});