import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Facebook, Instagram, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNewFacebookConnection } from '@/hooks/useNewFacebookConnection';
import { FacebookConnectionModal } from '@/components/FacebookConnectionModal';

interface SocialConnection {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string | null;
  token_expires_at: string | null;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean;
  permissions: string[] | null;
  created_at: string;
  updated_at: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  page_access_token_encrypted: string | null;
}

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

export default function Connections() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    pages: FacebookPage[];
    igAccounts: InstagramAccount[];
  }>({ pages: [], igAccounts: [] });
  
  const { 
    connecting, 
    initiateConnection, 
    handleCallback,
    loadConnections 
  } = useNewFacebookConnection();

  useEffect(() => {
    loadConnectionsData();
    
    // Check for OAuth callback in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      toast.error(`Facebook authentication error: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const loadConnectionsData = async () => {
    setLoading(true);
    try {
      const data = await loadConnections();
      setConnections(data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    toast.info('Processing Facebook authentication...');
    
    try {
      const result = await handleCallback(code, state);
      
      if (result.ok) {
        setModalData({
          pages: result.pages,
          igAccounts: result.ig_accounts
        });
        setShowModal(true);
        toast.success(`Found ${result.pages.length} pages and ${result.ig_accounts.length} Instagram accounts`);
      } else {
        toast.error(result.error || 'Failed to process authentication');
      }
    } catch (error) {
      toast.error('Failed to process Facebook authentication');
    }
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleConnectFacebook = async () => {
    console.log('Starting Facebook connection...');
    const result = await initiateConnection();
    console.log('Connection result:', result);
    
    if (result.authorize_url) {
      console.log('Redirecting to:', result.authorize_url);
      // Redirect to Facebook OAuth
      window.location.href = result.authorize_url;
    } else {
      console.error('No authorization URL received:', result.error);
      toast.error(result.error || 'Failed to initiate Facebook connection');
    }
  };

  const handleModalSuccess = () => {
    loadConnectionsData();
    setShowModal(false);
  };

  const getConnectionIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Social Media Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your Facebook Pages and Instagram Business accounts to start posting
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Connect Facebook Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              Facebook & Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect your Facebook Pages and Instagram Business accounts
                </p>
                <p className="text-xs text-muted-foreground">
                  Required permissions: pages_manage_posts, instagram_basic, instagram_content_publish
                </p>
              </div>
              <Button 
                onClick={handleConnectFacebook}
                disabled={connecting}
                className="ml-4"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="w-4 h-4 mr-2" />
                    Connect Facebook
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        {connections.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getConnectionIcon(connection.platform)}
                        <div>
                          <p className="font-medium">{connection.platform_username || connection.page_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {connection.platform === 'instagram' 
                              ? `@${connection.platform_username} • Connected to ${connection.page_name}`
                              : `Page ID: ${connection.platform_user_id}`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Connected {formatDate(connection.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={connection.platform === 'facebook' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {connection.platform}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {connections.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Facebook className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No accounts connected yet</p>
                <p className="text-sm">Connect your Facebook Pages and Instagram accounts to get started</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <FacebookConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pages={modalData.pages}
        igAccounts={modalData.igAccounts}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}