import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ScheduledPost {
  id: string;
  target_type: 'facebook_page' | 'instagram';
  target_id: string;
  message: string | null;
  media_url: string | null;
  link_url: string | null;
  status: 'queued' | 'published' | 'failed';
  run_at: string;
  published_at: string | null;
  result_json: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledPostWithTarget extends ScheduledPost {
  target_name?: string;
  target_username?: string;
}

export const useScheduledPosts = () => {
  const [posts, setPosts] = useState<ScheduledPostWithTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadScheduledPosts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('run_at', { ascending: true });

      if (error) throw error;

      // Enrich with target names
      const enrichedPosts = await Promise.all(
        (data || []).map(async (post) => {
          let targetName = 'Unknown';
          let targetUsername = '';

          if (post.target_type === 'facebook_page') {
            const { data: pageData } = await supabase
              .from('fb_pages')
              .select('name')
              .eq('page_id', post.target_id)
              .single();
            
            if (pageData) {
              targetName = pageData.name;
            }
          } else if (post.target_type === 'instagram') {
            const { data: igData } = await supabase
              .from('ig_accounts')
              .select('username')
              .eq('ig_user_id', post.target_id)
              .single();
            
            if (igData) {
              targetName = `@${igData.username}`;
              targetUsername = igData.username;
            }
          }

          return {
            ...post,
            target_name: targetName,
            target_username: targetUsername,
          };
        })
      );

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
      toast.error('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Scheduled post deleted');
      await loadScheduledPosts();
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      toast.error('Failed to delete scheduled post');
    }
  };

  const updateScheduledPost = async (postId: string, updates: Partial<ScheduledPost>) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;

      toast.success('Scheduled post updated');
      await loadScheduledPosts();
    } catch (error) {
      console.error('Error updating scheduled post:', error);
      toast.error('Failed to update scheduled post');
    }
  };

  const reschedulePost = async (postId: string, newRunAt: string) => {
    await updateScheduledPost(postId, { 
      run_at: newRunAt,
      status: 'queued'
    });
  };

  useEffect(() => {
    loadScheduledPosts();
  }, [user]);

  // Real-time updates for scheduled posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('scheduled-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadScheduledPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const queuedPosts = posts.filter(p => p.status === 'queued');
  const publishedPosts = posts.filter(p => p.status === 'published');
  const failedPosts = posts.filter(p => p.status === 'failed');
  
  const upcomingPosts = queuedPosts.filter(p => new Date(p.run_at) > new Date());
  const overduePosts = queuedPosts.filter(p => new Date(p.run_at) <= new Date());

  return {
    // Data
    posts,
    queuedPosts,
    publishedPosts,
    failedPosts,
    upcomingPosts,
    overduePosts,
    loading,

    // Actions
    loadScheduledPosts,
    deleteScheduledPost,
    updateScheduledPost,
    reschedulePost,

    // Computed
    totalScheduled: queuedPosts.length,
    totalPublished: publishedPosts.length,
    totalFailed: failedPosts.length,
  };
};