import { useState } from 'react';
import { Plus, Clock, Calendar, Settings, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchedules } from '@/hooks/useSchedules';
import { ScheduleForm } from '@/components/ScheduleForm';
import { ScheduleCard } from '@/components/ScheduleCard';
import { toast } from '@/hooks/use-toast';

const Schedule = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule, toggleSchedule } = useSchedules();

  const handleCreateSchedule = async (scheduleData) => {
    try {
      await createSchedule(scheduleData);
      setShowForm(false);
      toast({
        title: "Schedule created",
        description: "Your posting schedule has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSchedule = async (scheduleData) => {
    try {
      await updateSchedule(editingSchedule.id, scheduleData);
      setEditingSchedule(null);
      setShowForm(false);
      toast({
        title: "Schedule updated",
        description: "Your posting schedule has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await deleteSchedule(id);
      toast({
        title: "Schedule deleted",
        description: "Your posting schedule has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSchedule = async (id, isActive) => {
    try {
      await toggleSchedule(id, !isActive);
      toast({
        title: isActive ? "Schedule paused" : "Schedule activated",
        description: `Your posting schedule has been ${isActive ? 'paused' : 'activated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Posting Schedules</h1>
          <p className="text-muted-foreground mt-2">
            Manage your automated posting schedules and sync with n8n workflows
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gradient-primary shadow-soft"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {showForm && (
        <Card className="border-border shadow-medium">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScheduleForm
              initialData={editingSchedule}
              onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
              onCancel={() => {
                setShowForm(false);
                setEditingSchedule(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 ? (
        <Card className="border-border shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No schedules yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first posting schedule to automate your content distribution across social platforms.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="gradient-primary shadow-soft"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedule}
              onToggle={handleToggleSchedule}
            />
          ))}
        </div>
      )}

      <Card className="border-border shadow-soft bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            n8n Integration Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-foreground mb-2">1. Set up your n8n workflow</h4>
            <p className="text-muted-foreground text-sm">
              Create a workflow with a webhook trigger and add the webhook URL to your schedule settings.
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-foreground mb-2">2. Configure schedule timing</h4>
            <p className="text-muted-foreground text-sm">
              Set your desired posting days and times. The system will automatically trigger your n8n workflow.
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-foreground mb-2">3. Monitor execution</h4>
            <p className="text-muted-foreground text-sm">
              Track your schedule executions and view the status of each automated post.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;