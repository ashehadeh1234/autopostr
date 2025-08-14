import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  days_of_week: number[];
  times: string[];
  timezone: string;
  is_active: boolean;
  n8n_workflow_id?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  name: string;
  description?: string;
  days_of_week: number[];
  times: string[];
  timezone: string;
  webhook_url?: string;
  n8n_workflow_id?: string;
}

export const useSchedules = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules = [], isLoading: loading, error } = useQuery({
    queryKey: ['schedules', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!user,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: ScheduleFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('schedules')
        .insert({
          ...scheduleData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Trigger n8n workflow sync if webhook URL is provided
      if (scheduleData.webhook_url) {
        await triggerN8nSync(data.id, scheduleData);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', user?.id] });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, scheduleData }: { id: string; scheduleData: ScheduleFormData }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(scheduleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Trigger n8n workflow sync if webhook URL is provided
      if (scheduleData.webhook_url) {
        await triggerN8nSync(id, scheduleData);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', user?.id] });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', user?.id] });
    },
  });

  // Toggle schedule active status
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', user?.id] });
    },
  });

  // Helper function to trigger n8n workflow sync
  const triggerN8nSync = async (scheduleId: string, scheduleData: ScheduleFormData) => {
    try {
      const response = await supabase.functions.invoke('sync-schedule-with-n8n', {
        body: {
          scheduleId,
          scheduleData,
        },
      });

      if (response.error) {
        console.error('Failed to sync with n8n:', response.error);
      }
    } catch (error) {
      console.error('Error syncing with n8n:', error);
    }
  };

  return {
    schedules,
    loading,
    error,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: (id: string, scheduleData: ScheduleFormData) => 
      updateScheduleMutation.mutateAsync({ id, scheduleData }),
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    toggleSchedule: (id: string, isActive: boolean) => 
      toggleScheduleMutation.mutateAsync({ id, isActive }),
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
    isToggling: toggleScheduleMutation.isPending,
  };
};