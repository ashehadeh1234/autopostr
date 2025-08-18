import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: any;
}

interface FacebookPageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pages: FacebookPage[];
  userToken: string;
  onSuccess: (connectedPages: number) => void;
}

export const FacebookPageSelector: React.FC<FacebookPageSelectorProps> = ({
  isOpen,
  onClose,
  pages,
  userToken,
  onSuccess
}) => {
  const { session } = useAuth();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handleSaveSelected = async () => {
    if (selectedPages.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select at least one page to connect.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const selectedPageData = pages.filter(page => selectedPages.includes(page.id));
      
      const response = await supabase.functions.invoke('facebook-oauth', {
        body: { 
          action: 'saveSelectedPages',
          selectedPages: selectedPageData,
          userToken
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save selected pages');
      }

      onSuccess(selectedPageData.length);
      onClose();
      // Reset selection for next time
      setSelectedPages([]);
    } catch (error) {
      console.error('Failed to save selected pages:', error);
      toast({
        title: "Connection Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Facebook Pages</DialogTitle>
          <DialogDescription>
            Choose which Facebook pages you'd like to connect for posting.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pages.map((page) => (
            <Card key={page.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={page.id}
                    checked={selectedPages.includes(page.id)}
                    onCheckedChange={() => handlePageToggle(page.id)}
                  />
                  <div className="flex-1">
                    <label htmlFor={page.id} className="text-sm font-medium cursor-pointer">
                      {page.name}
                    </label>
                    {page.instagram_business_account && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Instagram Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSelected}
            disabled={saving || selectedPages.length === 0}
          >
            {saving ? 'Connecting...' : `Connect ${selectedPages.length} Page${selectedPages.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};