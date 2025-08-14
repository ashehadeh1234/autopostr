import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, X } from 'lucide-react';

const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  days_of_week: z.array(z.number()).min(1, 'Select at least one day'),
  times: z.array(z.string()).min(1, 'Add at least one time'),
  timezone: z.string().min(1, 'Timezone is required'),
  webhook_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  n8n_workflow_id: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  initialData?: any;
  onSubmit: (data: ScheduleFormData) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export const ScheduleForm = ({ initialData, onSubmit, onCancel }: ScheduleFormProps) => {
  const [newTime, setNewTime] = useState('');

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      days_of_week: initialData?.days_of_week || [],
      times: initialData?.times || [],
      timezone: initialData?.timezone || 'UTC',
      webhook_url: initialData?.webhook_url || '',
      n8n_workflow_id: initialData?.n8n_workflow_id || '',
    },
  });

  const { watch, setValue, getValues } = form;
  const currentTimes = watch('times');
  const currentDays = watch('days_of_week');

  const addTime = () => {
    if (newTime && !currentTimes.includes(newTime)) {
      setValue('times', [...currentTimes, newTime]);
      setNewTime('');
    }
  };

  const removeTime = (timeToRemove: string) => {
    setValue('times', currentTimes.filter(time => time !== timeToRemove));
  };

  const toggleDay = (dayValue: number) => {
    const currentDays = getValues('days_of_week');
    if (currentDays.includes(dayValue)) {
      setValue('days_of_week', currentDays.filter(day => day !== dayValue));
    } else {
      setValue('days_of_week', [...currentDays, dayValue]);
    }
  };

  const handleSubmit = (data: ScheduleFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Daily Morning Posts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this schedule..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <Label>Days of Week</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Card 
                key={day.value}
                className={`cursor-pointer transition-all ${
                  currentDays.includes(day.value) 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleDay(day.value)}
              >
                <CardContent className="p-3 text-center">
                  <span className="text-sm font-medium">{day.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {form.formState.errors.days_of_week && (
            <p className="text-sm text-destructive">{form.formState.errors.days_of_week.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <Label>Posting Times</Label>
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="Add time"
            />
            <Button 
              type="button" 
              onClick={addTime}
              disabled={!newTime}
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTimes.map((time) => (
              <Badge key={time} variant="secondary" className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {time}
                <button
                  type="button"
                  onClick={() => removeTime(time)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {form.formState.errors.times && (
            <p className="text-sm text-destructive">{form.formState.errors.times.message}</p>
          )}
        </div>

        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <Label className="text-primary font-semibold">n8n Integration</Label>
          
          <FormField
            control={form.control}
            name="webhook_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="n8n_workflow_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>n8n Workflow ID (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your n8n workflow ID"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="gradient-primary shadow-soft">
            {initialData ? 'Update Schedule' : 'Create Schedule'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};