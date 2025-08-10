import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Connection {
  id: string;
  name: string;
  platform: string;
  icon: React.ElementType;
  connected: boolean;
  enabled: boolean;
  description: string;
  color: string;
}

const Connections = () => {
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "twitter",
      name: "Twitter / X",
      platform: "twitter",
      icon: Twitter,
      connected: false,
      enabled: true,
      description: "Share your content on Twitter/X",
      color: "hsl(200, 50%, 50%)"
    },
    {
      id: "facebook",
      name: "Facebook",
      platform: "facebook",
      icon: Facebook,
      connected: false,
      enabled: true,
      description: "Post to your Facebook page",
      color: "hsl(221, 44%, 41%)"
    },
    {
      id: "instagram",
      name: "Instagram",
      platform: "instagram",
      icon: Instagram,
      connected: false,
      enabled: true,
      description: "Share photos and stories",
      color: "hsl(320, 70%, 50%)"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      platform: "linkedin",
      icon: Linkedin,
      connected: false,
      enabled: true,
      description: "Connect with professionals",
      color: "hsl(201, 100%, 35%)"
    },
    {
      id: "youtube",
      name: "YouTube",
      platform: "youtube",
      icon: Youtube,
      connected: false,
      enabled: true,
      description: "Upload and share videos",
      color: "hsl(0, 100%, 50%)"
    }
  ]);

  const handleConnect = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, connected: !conn.connected }
          : conn
      )
    );
    
    const connection = connections.find(c => c.id === connectionId);
    toast({
      title: connection?.connected ? "Disconnected" : "Connected",
      description: connection?.connected 
        ? `Disconnected from ${connection.name}`
        : `Successfully connected to ${connection.name}`,
    });
  };

  const handleToggleEnabled = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, enabled: !conn.enabled }
          : conn
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to start automating your posts
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => {
          const Icon = connection.icon;
          return (
            <Card key={connection.id} className="relative">
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
                            <AlertCircle className="h-3 w-3 mr-1" />
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
                    onClick={() => handleConnect(connection.id)}
                    variant={connection.connected ? "outline" : "default"}
                    className="w-full"
                  >
                    {connection.connected ? "Disconnect" : "Connect"}
                  </Button>
                  
                  {connection.connected && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-posting</span>
                      <Switch
                        checked={connection.enabled}
                        onCheckedChange={() => handleToggleEnabled(connection.id)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Manage your connected platforms and posting preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Total Connections</span>
              <span className="text-muted-foreground">
                {connections.filter(c => c.connected).length} of {connections.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Active Auto-posting</span>
              <span className="text-muted-foreground">
                {connections.filter(c => c.connected && c.enabled).length} platforms
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Connections;