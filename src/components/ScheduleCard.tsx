import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Clock, Calendar, MoreVertical, Edit, Trash2, Play, Pause } from 'lucide-react';
import { Schedule } from '@/hooks/useSchedules';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export const ScheduleCard = ({ schedule, onEdit, onDelete, onToggle }: ScheduleCardProps) => {

  return (
    <Card className={`shadow-soft transition-all hover:shadow-medium ${
      schedule.is_active 
        ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' 
        : 'border-border bg-card opacity-75'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {schedule.name}
            </CardTitle>
            {schedule.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {schedule.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={schedule.is_active ? 'default' : 'secondary'}
              className={schedule.is_active ? 'bg-success text-success-foreground' : ''}
            >
              {schedule.is_active ? 'Active' : 'Paused'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(schedule)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(schedule.id, schedule.is_active)}>
                  {schedule.is_active ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(schedule.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Interval:</span>
          <span className="text-foreground font-medium">
            Every {schedule.interval_value} {schedule.interval_unit}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Time between posts:</span>
          <span className="text-foreground font-medium">
            {schedule.time_between_posts > 0 
              ? `${schedule.time_between_posts} ${schedule.time_between_unit}`
              : 'No delay'
            }
          </span>
        </div>

        
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          Created: {new Date(schedule.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};