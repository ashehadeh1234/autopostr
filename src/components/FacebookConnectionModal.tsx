import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNewFacebookConnection } from '@/hooks/useNewFacebookConnection';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface InstagramAccount {
  ig_user_id: string;
  username: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
}

interface FacebookConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: FacebookPage[];
  igAccounts: InstagramAccount[];
  onSuccess: () => void;
}

export const FacebookConnectionModal = ({
  isOpen,
  onClose,
  pages,
  igAccounts,
  onSuccess
}: FacebookConnectionModalProps) => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedIgAccounts, setSelectedIgAccounts] = useState<Set<string>>(new Set());
  const { saving, saveConnections } = useNewFacebookConnection();

  const handlePageToggle = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
      // Also remove any IG accounts associated with this page
      const associatedIgAccounts = igAccounts
        .filter(ig => ig.page_id === pageId)
        .map(ig => ig.ig_user_id);
      
      const newSelectedIg = new Set(selectedIgAccounts);
      associatedIgAccounts.forEach(igId => newSelectedIg.delete(igId));
      setSelectedIgAccounts(newSelectedIg);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleIgToggle = (igUserId: string) => {
    const newSelected = new Set(selectedIgAccounts);
    const igAccount = igAccounts.find(ig => ig.ig_user_id === igUserId);
    
    if (newSelected.has(igUserId)) {
      newSelected.delete(igUserId);
    } else {
      newSelected.add(igUserId);
      // Also select the associated page
      if (igAccount) {
        setSelectedPages(prev => new Set(prev).add(igAccount.page_id));
      }
    }
    setSelectedIgAccounts(newSelected);
  };

  const handleSave = async () => {
    const selectedPagesData = pages.filter(page => selectedPages.has(page.id));
    const selectedIgData = igAccounts.filter(ig => selectedIgAccounts.has(ig.ig_user_id));

    if (selectedPagesData.length === 0 && selectedIgData.length === 0) {
      toast.error('Please select at least one page or Instagram account');
      return;
    }

    const result = await saveConnections(selectedPagesData, selectedIgData);
    
    if (result.ok) {
      toast.success(`Successfully connected ${selectedPagesData.length + selectedIgData.length} account(s)`);
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || 'Failed to save connections');
    }
  };

  const totalSelected = selectedPages.size + selectedIgAccounts.size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Facebook Pages & Instagram Accounts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {pages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Facebook Pages</h3>
              <div className="grid gap-3">
                {pages.map((page) => (
                  <Card key={page.id} className="cursor-pointer" onClick={() => handlePageToggle(page.id)}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedPages.has(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                        />
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-sm text-muted-foreground">Page ID: {page.id}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Facebook Page</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {igAccounts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Instagram Business Accounts</h3>
              <div className="grid gap-3">
                {igAccounts.map((igAccount) => (
                  <Card key={igAccount.ig_user_id} className="cursor-pointer" onClick={() => handleIgToggle(igAccount.ig_user_id)}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedIgAccounts.has(igAccount.ig_user_id)}
                          onChange={() => handleIgToggle(igAccount.ig_user_id)}
                        />
                        <div>
                          <p className="font-medium">@{igAccount.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Connected to: {igAccount.page_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Instagram</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pages.length === 0 && igAccounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No Facebook pages or Instagram accounts found. Make sure you have:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground">
                <li>• Admin access to Facebook pages</li>
                <li>• Instagram Business accounts connected to those pages</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || totalSelected === 0}
          >
            {saving ? 'Connecting...' : `Connect ${totalSelected} Account${totalSelected !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};