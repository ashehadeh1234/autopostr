import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Connection } from '@/constants/platforms';

interface ConnectionCardProps {
  connection: Connection;
  connecting: boolean;
  connectionError?: string;
  onConnect: (connectionId: string) => void;
  onToggleEnabled: (connectionId: string) => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  connecting,
  connectionError,
  onConnect,
  onToggleEnabled
}) => {
  const handleConnect = () => {
    onConnect(connection.id);
  };

  const handleToggleEnabled = () => {
    onToggleEnabled(connection.id);
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: connection.color }}
            >
              <connection.icon />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{connection.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                {connection.connected ? (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <XCircle className="w-3 h-3" />
                    <span>Not Connected</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {connection.description}
        </p>

        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={connecting}
            variant={connection.connected ? "outline" : "default"}
            className="w-full"
          >
            {connecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : connection.connected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>

          {connection.connected && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Auto-posting</p>
                <p className="text-xs text-muted-foreground">
                  Enable automatic posting to this platform
                </p>
              </div>
              <Switch
                checked={connection.enabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>
          )}

          {connection.connected && connection.pages && connection.pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected Pages</p>
              <div className="space-y-1">
                {connection.pages.map((page: any) => (
                  <div key={page.page_id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                    <span>{page.name}</span>
                    {page.is_default && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};