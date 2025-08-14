import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  interval_value: number;
  interval_unit: 'minutes' | 'hours' | 'days';
  time_between_posts: number;
  time_between_unit: 'seconds' | 'minutes' | 'hours';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  name: string;
  description?: string;
  interval_value: number;
  interval_unit: 'minutes' | 'hours' | 'days';
  time_between_posts: number;
  time_between_unit: 'seconds' | 'minutes' | 'hours';
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