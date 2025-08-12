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

const Chat = () => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) ready to send`,
      });
    }
  };

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;
    
    // Placeholder for sending to N8N webhook
    toast({
      title: "Message sent",
      description: "Your request is being processed by AI",
    });
    
    setMessage("");
    setFiles([]);
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
          {files.length > 0 && (
            <div className="w-full mb-6">
              <h3 className="text-sm font-medium mb-3">Uploaded Files ({files.length})</h3>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <Badge key={index} variant="secondary" className="p-2">
                    {file.type.startsWith('image/') && <Image className="w-3 h-3 mr-1" />}
                    {file.type.startsWith('video/') && <Video className="w-3 h-3 mr-1" />}
                    {!file.type.startsWith('image/') && !file.type.startsWith('video/') && (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    {file.name}
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
                className="flex-1 min-h-[120px] resize-none bg-accent/20 border-accent/40 focus-visible:ring-accent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
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
              <label htmlFor="chat-file-upload">
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload file
                </Button>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {files.length > 0 && `${files.length} file(s) attached • `}
                Press Enter to send, Shift+Enter for new line
              </p>
              <Button 
                onClick={handleSend} 
                disabled={!message.trim() && files.length === 0}
                className="group"
              >
                <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                Send
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