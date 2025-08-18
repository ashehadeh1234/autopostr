import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2, Power, PowerOff } from 'lucide-react';

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState(logger.getLogs());
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDebugMode, setIsDebugMode] = useState(logger.getDebugMode());

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const levelMatch = selectedLevel === 'all' || log.level === selectedLevel;
    const categoryMatch = selectedCategory === 'all' || log.category === selectedCategory;
    return levelMatch && categoryMatch;
  });

  const handleExport = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const toggleDebugMode = () => {
    logger.toggleDebugMode();
    setIsDebugMode(logger.getDebugMode());
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      case 'DEBUG': return 'outline';
      default: return 'default';
    }
  };

  const formatTime = (date: Date) => {
    return date.toISOString().split('T')[1].split('.')[0];
  };

  const uniqueCategories = [...new Set(logs.map(log => log.category))];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Debug Console
              <Badge variant={isDebugMode ? 'default' : 'secondary'}>
                {isDebugMode ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time application logging and debugging
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleDebugMode}
              variant={isDebugMode ? 'default' : 'outline'}
              size="sm"
            >
              {isDebugMode ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center text-sm text-muted-foreground">
            {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        <ScrollArea className="h-96 w-full rounded-md border">
          <div className="p-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-start gap-2">
                    <Badge variant={getLevelColor(log.level)} className="text-xs">
                      {log.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Data
                      </summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {index < filteredLogs.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};