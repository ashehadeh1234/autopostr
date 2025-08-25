import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Facebook, Instagram, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useFacebookConnection } from '@/hooks/useFacebookConnection';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SocialSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    isConnecting,
    pages,
    igAccounts, 
    adAccounts,
    socialConnections,
    loading,
    loadConnectionData,
    initiateConnection,
    handleCallback,
    disconnect,
    setDefaultPage,
    setDefaultIgAccount,
    setDefaultAdAccount,
    isConnected,
    hasPages,
    hasIgAccounts,
    hasAdAccounts,
  } = useFacebookConnection();

  useEffect(() => {
    loadConnectionData();
  }, []);

  // Handle OAuth callback if present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleCallback(code, state).then((success) => {
        if (success) {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to manage your social connections.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConnectionStatus = () => {
    if (!isConnected) return 'disconnected';
    
    const connection = socialConnections[0];
    if (!connection.token_expires_at) return 'connected';
    
    const expiryDate = new Date(connection.token_expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'connected';
  };

  const renderConnectionStatus = () => {
    const status = getConnectionStatus();
    
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        );
      case 'expiring':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Token Expiring Soon</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Not Connected</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Media Settings</h1>
        <p className="text-muted-foreground mt-2">
          Connect and manage your Facebook, Instagram, and ad accounts for AutoPostr.
        </p>
      </div>

      {/* Facebook Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Facebook className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Facebook Connection</CardTitle>
                <CardDescription>
                  Connect your Facebook account to manage pages and create content
                </CardDescription>
              </div>
            </div>
            {renderConnectionStatus()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To get started with AutoPostr, connect your Facebook account. This will allow you to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Manage your Facebook pages and post content</li>
                <li>• Access Instagram business accounts linked to your pages</li>
                <li>• Run ads and boost posts</li>
                <li>• View insights and analytics</li>
                <li>• Moderate comments and engage with your audience</li>
              </ul>
              <Button 
                onClick={initiateConnection}
                disabled={isConnecting}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect Facebook
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{socialConnections[0]?.platform_username}</p>
                  <p className="text-sm text-muted-foreground">
                    Connected on {formatDate(socialConnections[0]?.created_at)}
                  </p>
                  {socialConnections[0]?.token_expires_at && (
                    <p className="text-sm text-muted-foreground">
                      Token expires: {formatDate(socialConnections[0].token_expires_at)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={initiateConnection}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Reconnect
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={disconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">
                  {pages.length} Page{pages.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="secondary">
                  {igAccounts.length} Instagram Account{igAccounts.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="secondary">
                  {adAccounts.length} Ad Account{adAccounts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facebook Pages */}
      {hasPages && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              Facebook Pages
            </CardTitle>
            <CardDescription>
              Manage your connected Facebook pages and set your default posting target
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.page_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{page.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Connected {formatDate(page.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {page.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <label htmlFor={`page-${page.page_id}`} className="text-sm">
                        Default
                      </label>
                      <Switch
                        id={`page-${page.page_id}`}
                        checked={page.is_default}
                        onCheckedChange={() => setDefaultPage(page.page_id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instagram Accounts */}
      {hasIgAccounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              Instagram Accounts
            </CardTitle>
            <CardDescription>
              Instagram business accounts linked to your Facebook pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {igAccounts.map((account) => {
                const linkedPage = pages.find(p => p.page_id === account.page_id);
                return (
                  <div key={account.ig_user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">@{account.username}</h4>
                      <p className="text-sm text-muted-foreground">
                        Linked to {linkedPage?.name || 'Unknown Page'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {account.is_default && (
                        <Badge variant="default">Default</Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`ig-${account.ig_user_id}`} className="text-sm">
                          Default
                        </label>
                        <Switch
                          id={`ig-${account.ig_user_id}`}
                          checked={account.is_default}
                          onCheckedChange={() => setDefaultIgAccount(account.ig_user_id)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Accounts */}
      {hasAdAccounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Ad Accounts
            </CardTitle>
            <CardDescription>
              Your Facebook ad accounts for boosting posts and running campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adAccounts.map((account) => (
                <div key={account.ad_account_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{account.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {account.currency} • {account.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {account.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <label htmlFor={`ad-${account.ad_account_id}`} className="text-sm">
                        Default
                      </label>
                      <Switch
                        id={`ad-${account.ad_account_id}`}
                        checked={account.is_default}
                        onCheckedChange={() => setDefaultAdAccount(account.ad_account_id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Having trouble connecting your accounts or missing features?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Required Permissions:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Pages: Manage posts, read engagement, show list</li>
              <li>• Instagram: Basic access, content publishing</li>
              <li>• Ads: Management, reading insights</li>
              <li>• Business: Management for business-owned assets</li>
            </ul>
            
            <p className="pt-2"><strong>Troubleshooting:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Make sure you're an admin of the pages you want to connect</li>
              <li>• Instagram accounts must be business accounts linked to Facebook pages</li>
              <li>• Ad accounts require appropriate permissions in Business Manager</li>
              <li>• Tokens expire periodically and need to be refreshed</li>
            </ul>
          </div>
          
          {isConnected && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={initiateConnection}
                disabled={isConnecting}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Connection'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialSettings;