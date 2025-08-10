import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Grid3X3, 
  List, 
  Search, 
  Filter, 
  MoreVertical,
  Image,
  Video,
  FileText,
  Calendar,
  Copy,
  Trash2,
  Edit,
  RotateCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  createdAt: string;
  publicUrl: string;
  inRotation: boolean;
  thumbnail?: string;
}

const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'summer-menu-special.jpg',
    type: 'image',
    size: '2.1 MB',
    createdAt: '2024-01-15',
    publicUrl: 'https://example.com/image1.jpg',
    inRotation: true,
    thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop'
  },
  {
    id: '2',
    name: 'restaurant-interior.mp4',
    type: 'video',
    size: '15.3 MB',
    createdAt: '2024-01-14',
    publicUrl: 'https://example.com/video1.mp4',
    inRotation: true,
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop'
  },
  {
    id: '3',
    name: 'menu-items.pdf',
    type: 'document',
    size: '890 KB',
    createdAt: '2024-01-13',
    publicUrl: 'https://example.com/menu.pdf',
    inRotation: false
  },
];

const Library = () => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const { toast } = useToast();

  const handleUpload = () => {
    toast({
      title: "Upload feature",
      description: "File upload integration will connect to Supabase Storage",
    });
  };

  const handleCopyUrl = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: `${name} URL copied to clipboard`,
    });
  };

  const toggleRotation = (id: string) => {
    setAssets(prev => prev.map(asset => 
      asset.id === id ? { ...asset, inRotation: !asset.inRotation } : asset
    ));
    toast({
      title: "Rotation updated",
      description: "Asset rotation status changed",
    });
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
    toast({
      title: "Asset deleted",
      description: "Asset removed from library",
    });
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Manage your uploaded content and rotation settings
          </p>
        </div>
        <Button onClick={handleUpload} className="group">
          <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Upload Files
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && !searchQuery && (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-4">
            <Upload className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-4">
                Drag & drop to upload or paste links to get started
              </p>
              <Button onClick={handleUpload}>
                Upload Your First Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      {viewMode === 'grid' && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="group hover:shadow-medium transition-smooth">
              <CardContent className="p-4 space-y-3">
                {/* Thumbnail */}
                <div className="aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                  {asset.thumbnail ? (
                    <img 
                      src={asset.thumbnail} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      {getFileIcon(asset.type)}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium truncate flex-1">{asset.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyUrl(asset.publicUrl, asset.name)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleRotation(asset.id)}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {asset.inRotation ? 'Remove from' : 'Add to'} rotation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{asset.size}</span>
                    <div className="flex items-center space-x-1">
                      {getFileIcon(asset.type)}
                      <span>{asset.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                    {asset.inRotation && (
                      <Badge variant="success" className="text-xs">
                        In Rotation
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content List */}
      {viewMode === 'list' && filteredAssets.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="p-4 flex items-center space-x-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    {getFileIcon(asset.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">{asset.size} • {new Date(asset.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {asset.inRotation && (
                      <Badge variant="success" className="text-xs">
                        In Rotation
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyUrl(asset.publicUrl, asset.name)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleRotation(asset.id)}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {asset.inRotation ? 'Remove from' : 'Add to'} rotation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Results Hint */}
      {filteredAssets.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Best results:</strong> Upload 75+ photos/videos for optimal content rotation. 
            Current library: {filteredAssets.length} assets ({filteredAssets.filter(a => a.inRotation).length} in rotation)
          </p>
        </div>
      )}
    </div>
  );
};

export default Library;