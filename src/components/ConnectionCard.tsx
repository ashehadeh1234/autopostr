import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Connection } from '@/constants/platforms';

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
  const Icon = connection.icon;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${connection.color}15`, color: connection.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {connection.connected ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-4">
          {connection.description}
        </CardDescription>
        
        <div className="space-y-3">
          <Button 
            onClick={() => onConnect(connection.id)}
            variant={connection.connected ? "destructive" : "default"}
            className="w-full"
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              connection.connected ? "Disconnect" : "Connect"
            )}
          </Button>
          
          {connection.connected && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-posting</span>
              <Switch
                checked={connection.enabled}
                onCheckedChange={() => onToggleEnabled(connection.id)}
              />
            </div>
          )}
        </div>

        {/* Show connection error if any */}
        {connectionError && (
          <div className="mt-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">
                {connectionError}
              </div>
            </div>
          </div>
        )}

        {/* Show connected pages for Facebook */}
        {connection.connected && connection.pages && connection.pages.length > 0 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md">
            <h4 className="text-sm font-medium mb-2">Connected Pages</h4>
            <div className="space-y-1">
              {connection.pages.map((page, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {page.pageName}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};