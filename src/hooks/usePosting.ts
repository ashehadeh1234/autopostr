import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FacebookPostRequest {
  page_id: string;
  message?: string;
  link?: string;
  photo_url?: string;
  video_url?: string;
  scheduled_unix?: number;
}

export interface InstagramPostRequest {
  ig_user_id: string;
  caption?: string;
  image_url?: string;
  video_url?: string;
  scheduled_unix?: number;
}

export interface PostResponse {
  success: boolean;
  post_id?: string;
  scheduled: boolean;
  message: string;
  facebook_response?: any;
  instagram_response?: any;
  error?: string;
}

export const usePosting = () => {
  const [isPosting, setIsPosting] = useState(false);
  const { session } = useAuth();

  const postToFacebook = async (request: FacebookPostRequest): Promise<PostResponse | null> => {
    if (!session?.access_token) {
      toast.error('Please log in first');
      return null;
    }

    setIsPosting(true);
    
    try {
      console.log('Posting to Facebook:', request);
      
      const { data, error } = await supabase.functions.invoke('post-facebook', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to post to Facebook');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response: PostResponse = {
        success: true,
        post_id: data.post_id,
        scheduled: data.scheduled || false,
        message: data.message || 'Posted successfully',
        facebook_response: data.facebook_response,
      };

      toast.success(response.message);
      return response;

    } catch (error) {
      console.error('Facebook posting error:', error);
      const errorMessage = error.message || 'Failed to post to Facebook';
      toast.error(errorMessage);
      
      return {
        success: false,
        scheduled: false,
        message: errorMessage,
        error: errorMessage,
      };
    } finally {
      setIsPosting(false);
    }
  };

  const postToInstagram = async (request: InstagramPostRequest): Promise<PostResponse | null> => {
    if (!session?.access_token) {
      toast.error('Please log in first');
      return null;
    }

    setIsPosting(true);
    
    try {
      console.log('Posting to Instagram:', request);
      
      const { data, error } = await supabase.functions.invoke('post-instagram', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to post to Instagram');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response: PostResponse = {
        success: true,
        post_id: data.post_id,
        scheduled: data.scheduled || false,
        message: data.message || 'Posted successfully',
        instagram_response: data.instagram_response,
      };

      toast.success(response.message);
      return response;

    } catch (error) {
      console.error('Instagram posting error:', error);
      const errorMessage = error.message || 'Failed to post to Instagram';
      toast.error(errorMessage);
      
      return {
        success: false,
        scheduled: false,
        message: errorMessage,
        error: errorMessage,
      };
    } finally {
      setIsPosting(false);
    }
  };

  const validateImageUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url) return { valid: false, error: 'Image URL is required' };
    
    try {
      new URL(url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    const lowerUrl = url.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    
    if (!hasValidExtension) {
      return { valid: false, error: 'Only JPG, PNG, and GIF images are supported' };
    }
    
    return { valid: true };
  };

  const validateVideoUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url) return { valid: false, error: 'Video URL is required' };
    
    try {
      new URL(url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    const lowerUrl = url.toLowerCase();
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    
    if (!hasValidExtension) {
      return { valid: false, error: 'Only MP4, MOV, AVI, and MKV videos are supported' };
    }
    
    return { valid: true };
  };

  const validateScheduleTime = (scheduledTime: Date): { valid: boolean; error?: string } => {
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    if (scheduledTime < minScheduleTime) {
      return { 
        valid: false, 
        error: 'Scheduled time must be at least 10 minutes in the future' 
      };
    }
    
    const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    if (scheduledTime > maxScheduleTime) {
      return { 
        valid: false, 
        error: 'Scheduled time cannot be more than 1 year in the future' 
      };
    }
    
    return { valid: true };
  };

  return {
    // State
    isPosting,
    
    // Actions
    postToFacebook,
    postToInstagram,
    
    // Validation helpers
    validateImageUrl,
    validateVideoUrl,
    validateScheduleTime,
  };
};