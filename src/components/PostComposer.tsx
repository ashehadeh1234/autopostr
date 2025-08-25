import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Facebook, Instagram, Image, Video, Link as LinkIcon, Calendar as CalendarIcon, Clock, Send, Loader2, AlertCircle } from 'lucide-react';
import { useFacebookConnection } from '@/hooks/useFacebookConnection';
import { usePosting } from '@/hooks/usePosting';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PostComposer: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    pages,
    igAccounts,
    loadConnectionData,
    hasPages,
    hasIgAccounts,
    isConnected
  } = useFacebookConnection();

  const {
    isPosting,
    postToFacebook,
    postToInstagram,
    validateImageUrl,
    validateVideoUrl,
    validateScheduleTime
  } = usePosting();

  useEffect(() => {
    loadConnectionData();
  }, []);

  // Auto-select default target when platform changes
  useEffect(() => {
    if (selectedPlatform === 'facebook' && hasPages) {
      const defaultPage = pages.find(p => p.is_default) || pages[0];
      if (defaultPage) {
        setSelectedTarget(defaultPage.page_id);
      }
    } else if (selectedPlatform === 'instagram' && hasIgAccounts) {
      const defaultIg = igAccounts.find(ig => ig.is_default) || igAccounts[0];
      if (defaultIg) {
        setSelectedTarget(defaultIg.ig_user_id);
      }
    }
  }, [selectedPlatform, pages, igAccounts, hasPages, hasIgAccounts]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Target validation
    if (!selectedTarget) {
      newErrors.target = 'Please select a target page or account';
    }

    // Content validation
    if (!message && !mediaUrl && !linkUrl) {
      newErrors.content = 'Please add some content (message, media, or link)';
    }

    // Media validation
    if (mediaUrl) {
      if (mediaType === 'image') {
        const imageValidation = validateImageUrl(mediaUrl);
        if (!imageValidation.valid) {
          newErrors.media = imageValidation.error!;
        }
      } else if (mediaType === 'video') {
        const videoValidation = validateVideoUrl(mediaUrl);
        if (!videoValidation.valid) {
          newErrors.media = videoValidation.error!;
        }
      }
    }

    // Instagram specific validation
    if (selectedPlatform === 'instagram') {
      if (!mediaUrl) {
        newErrors.media = 'Instagram posts require an image or video';
      }
      if (linkUrl) {
        newErrors.link = 'Instagram does not support link posts';
      }
    }

    // Schedule validation
    if (isScheduled && scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(hours, minutes, 0, 0);

      const scheduleValidation = validateScheduleTime(scheduleDateTime);
      if (!scheduleValidation.valid) {
        newErrors.schedule = scheduleValidation.error!;
      }
    } else if (isScheduled) {
      newErrors.schedule = 'Please select a date and time for scheduling';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    let scheduledUnix: number | undefined;
    
    if (isScheduled && scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(hours, minutes, 0, 0);
      scheduledUnix = Math.floor(scheduleDateTime.getTime() / 1000);
    }

    let response;

    if (selectedPlatform === 'facebook') {
      response = await postToFacebook({
        page_id: selectedTarget,
        message: message || undefined,
        link: linkUrl || undefined,
        photo_url: mediaType === 'image' ? mediaUrl : undefined,
        video_url: mediaType === 'video' ? mediaUrl : undefined,
        scheduled_unix: scheduledUnix,
      });
    } else {
      response = await postToInstagram({
        ig_user_id: selectedTarget,
        caption: message || undefined,
        image_url: mediaType === 'image' ? mediaUrl : undefined,
        video_url: mediaType === 'video' ? mediaUrl : undefined,
        scheduled_unix: scheduledUnix,
      });
    }

    if (response?.success) {
      // Reset form
      setMessage('');
      setMediaUrl('');
      setLinkUrl('');
      setMediaType('none');
      setIsScheduled(false);
      setScheduledDate(undefined);
      setScheduledTime('12:00');
      setErrors({});
    }
  };

  const getTargetName = (targetId: string): string => {
    if (selectedPlatform === 'facebook') {
      const page = pages.find(p => p.page_id === targetId);
      return page?.name || 'Unknown Page';
    } else {
      const igAccount = igAccounts.find(ig => ig.ig_user_id === targetId);
      return `@${igAccount?.username}` || 'Unknown Account';
    }
  };

  const formatScheduleDateTime = (): string => {
    if (!scheduledDate || !scheduledTime) return '';
    
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduleDateTime = new Date(scheduledDate);
    scheduleDateTime.setHours(hours, minutes, 0, 0);
    
    return format(scheduleDateTime, 'MMM d, yyyy \'at\' h:mm a');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Post Composer
          </CardTitle>
          <CardDescription>
            Create and schedule posts for your social media accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Social Media Connections</h3>
            <p className="text-muted-foreground mb-4">
              You need to connect your Facebook account first to start posting content.
            </p>
            <Button onClick={() => window.location.href = '/app/social-settings'}>
              Connect Facebook
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Post Composer
        </CardTitle>
        <CardDescription>
          Create and schedule posts for your social media accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label>Platform</Label>
          <Tabs value={selectedPlatform} onValueChange={(value: string) => setSelectedPlatform(value as 'facebook' | 'instagram')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="facebook" disabled={!hasPages}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
                {!hasPages && <Badge variant="secondary" className="ml-2 text-xs">No Pages</Badge>}
              </TabsTrigger>
              <TabsTrigger value="instagram" disabled={!hasIgAccounts}>
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
                {!hasIgAccounts && <Badge variant="secondary" className="ml-2 text-xs">No Accounts</Badge>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Target Selection */}
        <div className="space-y-2">
          <Label htmlFor="target">
            {selectedPlatform === 'facebook' ? 'Facebook Page' : 'Instagram Account'}
          </Label>
          <Select value={selectedTarget} onValueChange={setSelectedTarget}>
            <SelectTrigger>
              <SelectValue placeholder={`Select a ${selectedPlatform === 'facebook' ? 'page' : 'account'}`} />
            </SelectTrigger>
            <SelectContent>
              {selectedPlatform === 'facebook' 
                ? pages.map((page) => (
                    <SelectItem key={page.page_id} value={page.page_id}>
                      <div className="flex items-center gap-2">
                        {page.name}
                        {page.is_default && <Badge variant="secondary">Default</Badge>}
                      </div>
                    </SelectItem>
                  ))
                : igAccounts.map((account) => (
                    <SelectItem key={account.ig_user_id} value={account.ig_user_id}>
                      <div className="flex items-center gap-2">
                        @{account.username}
                        {account.is_default && <Badge variant="secondary">Default</Badge>}
                      </div>
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
          {errors.target && <p className="text-sm text-destructive">{errors.target}</p>}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">
            {selectedPlatform === 'facebook' ? 'Message' : 'Caption'}
          </Label>
          <Textarea
            id="message"
            placeholder={selectedPlatform === 'facebook' 
              ? "What's on your mind?" 
              : "Write a caption for your post..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{message.length} characters</span>
            {selectedPlatform === 'instagram' && message.length > 2200 && (
              <span className="text-destructive">Instagram captions are limited to 2,200 characters</span>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Media</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mediaType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType(mediaType === 'image' ? 'none' : 'image')}
              >
                <Image className="h-4 w-4 mr-1" />
                Image
              </Button>
              <Button
                type="button"
                variant={mediaType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
              >
                <Video className="h-4 w-4 mr-1" />
                Video
              </Button>
            </div>
          </div>
          
          {(mediaType === 'image' || mediaType === 'video') && (
            <div className="space-y-2">
              <Input
                placeholder={`Enter ${mediaType} URL`}
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              {errors.media && <p className="text-sm text-destructive">{errors.media}</p>}
            </div>
          )}
        </div>

        {/* Link (Facebook only) */}
        {selectedPlatform === 'facebook' && (
          <div className="space-y-2">
            <Label htmlFor="link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link (optional)
            </Label>
            <Input
              id="link"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            {errors.link && <p className="text-sm text-destructive">{errors.link}</p>}
          </div>
        )}

        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}

        <Separator />

        {/* Scheduling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule Post
            </Label>
            <Switch
              id="schedule"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
          </div>

          {isScheduled && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              {scheduledDate && scheduledTime && (
                <div className="text-sm text-muted-foreground">
                  <strong>Scheduled for:</strong> {formatScheduleDateTime()}
                </div>
              )}

              {selectedPlatform === 'instagram' && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  <strong>Note:</strong> Instagram doesn't support native scheduling. 
                  Your post will be queued and published automatically at the scheduled time.
                </div>
              )}

              {errors.schedule && <p className="text-sm text-destructive">{errors.schedule}</p>}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedTarget && (
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              {selectedPlatform === 'facebook' ? (
                <Facebook className="h-4 w-4 text-blue-600" />
              ) : (
                <Instagram className="h-4 w-4 text-pink-600" />
              )}
              <span className="text-sm font-medium">
                Posting to: {getTargetName(selectedTarget)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {message && <p className="mb-2">{message}</p>}
              {mediaUrl && (
                <p className="mb-2">
                  {mediaType === 'image' ? '📷' : '🎥'} Media: {mediaUrl}
                </p>
              )}
              {linkUrl && <p className="mb-2">🔗 Link: {linkUrl}</p>}
              {isScheduled && scheduledDate && scheduledTime && (
                <p>⏰ Scheduled: {formatScheduleDateTime()}</p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isPosting || !selectedTarget}
          className="w-full"
          size="lg"
        >
          {isPosting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isScheduled ? 'Scheduling...' : 'Posting...'}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {isScheduled ? 'Schedule Post' : 'Post Now'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PostComposer;