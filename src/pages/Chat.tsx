import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Send, 
  Image, 
  Video, 
  FileText, 
  Sparkles,
  Calendar,
  Library,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { uploadFile } = useAssets();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Upload files to storage immediately to get public URLs
      setIsLoading(true);
      const uploadPromises = newFiles.map(async (file) => {
        try {
          const asset = await uploadFile(file);
          return asset;
        } catch (error) {
          console.error("Failed to upload file:", error);
          toast({
            title: "File upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          return null;
        }
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(Boolean);
      setUploadedAssets(prev => [...prev, ...successfulUploads]);
      setIsLoading(false);
      
      if (successfulUploads.length > 0) {
        toast({
          title: "Files uploaded",
          description: `${successfulUploads.length} file(s) uploaded and ready to send`,
        });
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim() && uploadedAssets.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Prepare data for n8n webhook with public file URLs
      const webhookData = {
        message: message.trim(),
        files: uploadedAssets.map(asset => ({
          name: asset.name,
          type: asset.type,
          size: asset.size,
          url: asset.url,
          storage_path: asset.storage_path
        })),
        timestamp: new Date().toISOString(),
        source: "chat_interface"
      };

      console.log("Sending to n8n webhook:", webhookData);

      // Send to n8n webhook
      const response = await fetch("https://ajs123456.app.n8n.cloud/webhook-test/bf41bcf6-20d2-48a3-ba36-978833e0f4ea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        const result = await response.text();
        console.log("n8n webhook response:", result);
        
        toast({
          title: "Message sent to workflow",
          description: "Your request is being processed by n8n",
        });
      } else {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending to n8n webhook:", error);
      toast({
        title: "Failed to send message",
        description: "Could not connect to n8n workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setMessage("");
      setFiles([]);
      setUploadedAssets([]);
    }
  };

  const quickActions = [
    {
      title: "Upload & Post Now",
      description: "Upload content and post immediately",
      icon: Zap,
      action: () => toast({ title: "Feature coming soon!" }),
    },
    {
      title: "Generate Captions",
      description: "AI will analyze your images and create captions",
      icon: Sparkles,
      action: () => toast({ title: "Feature coming soon!" }),
    },
    {
      title: "Add to Library",
      description: "Save content for future automated posting",
      icon: Library,
      action: () => toast({ title: "Feature coming soon!" }),
    },
    {
      title: "Create Schedule",
      description: "Set up automated posting times",
      icon: Calendar,
      action: () => toast({ title: "Feature coming soon!" }),
    },
  ];

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Hi! I'm your AI social media assistant.</h1>
            <p className="text-lg text-muted-foreground">
              Upload files, ask questions, or tell me what you'd like to post. I'll help you create engaging content.
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedAssets.length > 0 && (
            <div className="w-full mb-6">
              <h3 className="text-sm font-medium mb-3">Uploaded Files ({uploadedAssets.length})</h3>
              <div className="flex flex-wrap gap-2">
                {uploadedAssets.map((asset, index) => (
                  <Badge key={index} variant="secondary" className="p-2">
                    {asset.type.startsWith('image/') && <Image className="w-3 h-3 mr-1" />}
                    {asset.type.startsWith('video/') && <Video className="w-3 h-3 mr-1" />}
                    {!asset.type.startsWith('image/') && !asset.type.startsWith('video/') && (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    {asset.name} ✓
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="w-full space-y-3">
            <div className="flex space-x-4">
              <Textarea
                placeholder="What would you like me to help you with? (e.g., 'Create captions for these images' or 'Schedule these posts for this week')"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 min-h-[120px] resize-none rounded-2xl bg-background/95 border border-border shadow-sm focus-visible:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
            </div>
            {/* Small Upload Button under chatbox */}
            <div className="flex items-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.zip,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="chat-file-upload"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full shadow-sm"
                onClick={() => document.getElementById('chat-file-upload')?.click()}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload file
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {uploadedAssets.length > 0 && `${uploadedAssets.length} file(s) ready • `}
                Press Enter to send, Shift+Enter for new line
              </p>
              <Button 
                onClick={handleSend} 
                disabled={(!message.trim() && uploadedAssets.length === 0) || isLoading}
                className="group rounded-full shadow-sm"
              >
                <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Quick Actions */}
      <div className="w-80 border-l border-border p-6 bg-secondary/20">
        <h2 className="text-lg font-semibold mb-6">What you can do</h2>
        <div className="space-y-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-medium transition-smooth" onClick={action.action}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <action.icon className="w-4 h-4 mr-2 text-primary" />
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-sm mb-2">💡 Pro Tip</h3>
          <p className="text-xs text-muted-foreground">
            Upload 75+ photos/videos to get the best results from content rotation. The more variety, the better!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
