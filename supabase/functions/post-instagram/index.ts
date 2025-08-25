import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramPostRequest {
  ig_user_id: string;
  caption?: string;
  image_url?: string;
  video_url?: string;
  scheduled_unix?: number; // For database scheduling, not native IG scheduling
}

interface InstagramContainerResponse {
  id: string;
}

interface InstagramPublishResponse {
  id: string;
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

const getPageAccessToken = async (supabase: any, igUserId: string, userId: string): Promise<string> => {
  // Get the page access token via the IG account's linked page
  const { data: igAccount, error: igError } = await supabase
    .from('ig_accounts')
    .select('page_id')
    .eq('ig_user_id', igUserId)
    .single();
  
  if (igError || !igAccount) {
    throw new Error('Instagram account not found');
  }
  
  const { data: token, error: tokenError } = await supabase
    .rpc('get_decrypted_page_access_token', { p_page_id: igAccount.page_id });
  
  if (tokenError || !token) {
    throw new Error('Failed to get page access token');
  }
  
  return token;
};

const validateImageUrl = (imageUrl: string): void => {
  // Instagram image requirements
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const url = imageUrl.toLowerCase();
  
  if (!allowedExtensions.some(ext => url.includes(ext))) {
    throw new Error('Instagram only supports JPEG and PNG images');
  }
  
  // Additional validation could be added here for:
  // - Image size limits (max 8MB)
  // - Aspect ratio (4:5 to 1.91:1)
  // - Minimum resolution (320px)
};

const createInstagramContainer = async (
  pageAccessToken: string,
  igUserId: string,
  request: InstagramPostRequest
): Promise<InstagramContainerResponse> => {
  const { caption, image_url, video_url } = request;
  
  if (!image_url && !video_url) {
    throw new Error('Either image_url or video_url is required for Instagram posts');
  }
  
  if (image_url) {
    validateImageUrl(image_url);
  }
  
  const endpoint = `https://graph.facebook.com/v18.0/${igUserId}/media`;
  
  const payload: Record<string, any> = {
    access_token: pageAccessToken,
  };
  
  if (image_url) {
    payload.image_url = image_url;
  }
  
  if (video_url) {
    payload.video_url = video_url;
    payload.media_type = 'VIDEO';
  }
  
  if (caption) {
    payload.caption = caption;
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Instagram container creation failed: ${data.error?.message || JSON.stringify(data)}`);
  }
  
  return data;
};

const publishInstagramContainer = async (
  pageAccessToken: string,
  igUserId: string,
  containerId: string
): Promise<InstagramPublishResponse> => {
  const endpoint = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
  
  const payload = {
    creation_id: containerId,
    access_token: pageAccessToken,
  };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Instagram publish failed: ${data.error?.message || JSON.stringify(data)}`);
  }
  
  return data;
};

const postToInstagram = async (
  pageAccessToken: string,
  igUserId: string,
  request: InstagramPostRequest
): Promise<{ container: InstagramContainerResponse; published?: InstagramPublishResponse }> => {
  
  // Step 1: Create container
  console.log('Creating Instagram container...');
  const container = await createInstagramContainer(pageAccessToken, igUserId, request);
  
  // Step 2: Publish immediately if not scheduled
  if (!request.scheduled_unix) {
    console.log('Publishing Instagram container...');
    
    // Small delay to ensure container is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const published = await publishInstagramContainer(pageAccessToken, igUserId, container.id);
    
    return { container, published };
  }
  
  return { container };
};

const saveScheduledPost = async (
  supabase: any,
  userId: string,
  request: InstagramPostRequest,
  igResponse: { container: InstagramContainerResponse; published?: InstagramPublishResponse } | null = null,
  error: string | null = null
) => {
  const postData = {
    user_id: userId,
    target_type: 'instagram' as const,
    target_id: request.ig_user_id,
    message: request.caption || null,
    media_url: request.image_url || request.video_url || null,
    link_url: null, // Instagram doesn't support link posts in the same way
    status: error ? 'failed' as const : (request.scheduled_unix ? 'queued' as const : 'published' as const),
    run_at: request.scheduled_unix ? new Date(request.scheduled_unix * 1000).toISOString() : new Date().toISOString(),
    published_at: (!request.scheduled_unix && !error && igResponse?.published) ? new Date().toISOString() : null,
    result_json: igResponse ? {
      container_id: igResponse.container?.id,
      media_id: igResponse.published?.id,
      scheduled: !!request.scheduled_unix
    } : null,
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
    
    const request: InstagramPostRequest = await req.json();
    
    // Validate required fields
    if (!request.ig_user_id) {
      return new Response(JSON.stringify({ error: 'ig_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!request.image_url && !request.video_url) {
      return new Response(JSON.stringify({ error: 'Either image_url or video_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify user owns this IG account (through page ownership)
    const { data: igAccount, error: igError } = await supabase
      .from('ig_accounts')
      .select(`
        ig_user_id,
        page_id,
        fb_pages!inner(user_id)
      `)
      .eq('ig_user_id', request.ig_user_id)
      .eq('fb_pages.user_id', user.id)
      .single();
    
    if (igError || !igAccount) {
      return new Response(JSON.stringify({ error: 'Instagram account not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let igResponse: { container: InstagramContainerResponse; published?: InstagramPublishResponse } | null = null;
    let errorMessage: string | null = null;
    
    try {
      // Get page access token
      const pageAccessToken = await getPageAccessToken(supabase, request.ig_user_id, user.id);
      
      // Post to Instagram
      igResponse = await postToInstagram(pageAccessToken, request.ig_user_id, request);
      
      console.log('Instagram post successful:', igResponse);
      
    } catch (error) {
      console.error('Instagram posting error:', error);
      errorMessage = error.message;
    }
    
    // Save to database
    const savedPost = await saveScheduledPost(supabase, user.id, request, igResponse, errorMessage);
    
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
      instagram_response: igResponse,
      post_id: savedPost?.id,
      scheduled: !!request.scheduled_unix,
      message: request.scheduled_unix 
        ? 'Instagram post scheduled successfully (will be published via cron job)' 
        : 'Instagram post published successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Instagram post function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});