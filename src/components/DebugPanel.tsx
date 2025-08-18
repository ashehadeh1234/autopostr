import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bug, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Copy
} from "lucide-react";
import { errorHandler, ErrorLog } from "@/utils/errorHandling";
import { connectionManager, ConnectionHealth } from "@/utils/connectionUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [connectionHealths, setConnectionHealths] = useState<ConnectionHealth[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshErrors();
      refreshConnectionHealth();
    }
  }, [isOpen]);

  const refreshErrors = () => {
    setErrors(errorHandler.getRecentErrors(50));
  };

  const refreshConnectionHealth = async () => {
    if (!user) return;
    
    setIsLoadingHealth(true);
    try {
      const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
      const healthChecks = await Promise.all(
        platforms.map(platform => connectionManager.checkConnectionHealth(platform, user.id))
      );
      setConnectionHealths(healthChecks);
    } catch (error) {
      console.error('Failed to check connection health:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const exportLogs = () => {
    const logs = errorHandler.exportErrorLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autopostr-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "Debug logs have been downloaded to your device."
    });
  };

  const clearLogs = () => {
    errorHandler.clearLogs();
    refreshErrors();
    toast({
      title: "Logs Cleared",
      description: "All error logs have been cleared."
    });
  };

  const copyErrorToClipboard = (error: ErrorLog) => {
    const errorText = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(errorText);
    toast({
      title: "Copied",
      description: "Error details copied to clipboard."
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'high': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'low': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Debug Panel</span>
            </CardTitle>
            <CardDescription>
              System diagnostics and error monitoring
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="errors">Error Logs</TabsTrigger>
              <TabsTrigger value="connections">Connection Health</TabsTrigger>
              <TabsTrigger value="system">System Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Errors ({errors.length})</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={refreshErrors}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {errors.map((errorLog) => (
                    <Card key={errorLog.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(errorLog.error.severity)}>
                              {errorLog.error.severity}
                            </Badge>
                            <Badge variant="outline">
                              {errorLog.error.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(errorLog.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{errorLog.error.code}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {errorLog.error.message}
                          </p>
                          {errorLog.error.userMessage && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              User Message: {errorLog.error.userMessage}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyErrorToClipboard(errorLog)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {errors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No errors recorded in this session
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="connections" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Connection Health</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshConnectionHealth}
                  disabled={isLoadingHealth}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <div className="grid gap-3">
                {connectionHealths.map((health) => (
                  <Card key={health.platform} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getHealthStatusIcon(health.status)}
                        <span className="font-medium capitalize">{health.platform}</span>
                        <Badge variant="outline">
                          {health.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(health.lastChecked).toLocaleString()}
                      </span>
                    </div>
                    
                    {health.tokenExpiry && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Token expires: {new Date(health.tokenExpiry).toLocaleString()}
                      </p>
                    )}
                    
                    {health.issues.length > 0 && (
                      <div className="space-y-1">
                        {health.issues.map((issue, index) => (
                          <p key={index} className="text-xs text-red-600 dark:text-red-400">
                            • {issue}
                          </p>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="system" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>User Agent:</strong>
                      <p className="text-muted-foreground text-xs mt-1 break-all">
                        {navigator.userAgent}
                      </p>
                    </div>
                    <div>
                      <strong>URL:</strong>
                      <p className="text-muted-foreground text-xs mt-1 break-all">
                        {window.location.href}
                      </p>
                    </div>
                    <div>
                      <strong>Screen:</strong>
                      <p className="text-muted-foreground text-xs mt-1">
                        {screen.width}x{screen.height}
                      </p>
                    </div>
                    <div>
                      <strong>Viewport:</strong>
                      <p className="text-muted-foreground text-xs mt-1">
                        {window.innerWidth}x{window.innerHeight}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Local Storage Usage</h4>
                  <div className="text-xs space-y-1">
                    {Object.keys(localStorage).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{localStorage.getItem(key)?.length || 0} chars</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}