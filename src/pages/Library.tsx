import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Copy,
  Trash2,
  Edit,
  RotateCcw,
  CheckSquare,
  Square,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUpload } from "@/components/FileUpload";
import { MediaViewer } from "@/components/MediaViewer";
import { useAssets } from "@/hooks/useAssets";

const Library = () => {
  const { 
    assets, 
    loading, 
    uploadFile, 
    deleteAsset, 
    toggleRotation, 
    copyUrl,
    deleteMultipleAssets,
    toggleMultipleRotation,
    copyMultipleUrls
  } = useAssets();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const handleFileSelect = async (files: FileList) => {
    console.log(`Starting upload of ${files.length} files`);
    
    // Upload all files in parallel instead of sequentially
    const uploadPromises = Array.from(files).map((file, index) => {
      console.log(`Uploading file ${index + 1}: ${file.name}`);
      return uploadFile(file);
    });
    
    try {
      await Promise.all(uploadPromises);
      console.log('All files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleAssetClick = (asset: any) => {
    if (asset.type.startsWith('image/') || asset.type.startsWith('video/')) {
      setSelectedAsset(asset);
      setIsViewerOpen(true);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selection management functions
  const toggleSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const selectAll = () => {
    setSelectedAssets(new Set(filteredAssets.map(asset => asset.id)));
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    clearSelection();
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;
    if (!confirm(`Delete ${selectedAssets.size} selected assets?`)) return;
    
    const assetIds = Array.from(selectedAssets);
    await deleteMultipleAssets(assetIds);
    clearSelection();
  };

  const handleBulkToggleRotation = async (enable: boolean) => {
    if (selectedAssets.size === 0) return;
    
    const assetIds = Array.from(selectedAssets);
    await toggleMultipleRotation(assetIds, enable);
    clearSelection();
  };

  const handleBulkCopyUrls = () => {
    if (selectedAssets.size === 0) return;
    
    const selectedAssetObjects = filteredAssets.filter(asset => selectedAssets.has(asset.id));
    copyMultipleUrls(selectedAssetObjects);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        exitSelectionMode();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isSelectionMode]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
        <FileUpload 
          onFileSelect={handleFileSelect}
          accept="*/*"
          multiple={true}
        />
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
          <Button 
            variant={isSelectionMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Select
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

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedAssets.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All ({filteredAssets.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkCopyUrls}
                  disabled={selectedAssets.size === 0}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URLs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkToggleRotation(true)}
                  disabled={selectedAssets.size === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Add to Rotation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkToggleRotation(false)}
                  disabled={selectedAssets.size === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Remove from Rotation
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={selectedAssets.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedAssets.size})
                </Button>
                <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAssets.length === 0 && !searchQuery && (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-4">
            <Upload className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-4">
                Drag & drop to upload or paste links to get started
              </p>
              <FileUpload onFileSelect={handleFileSelect} multiple={true} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      {!loading && viewMode === 'grid' && filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
             <Card key={asset.id} className={`group hover:shadow-medium transition-smooth ${selectedAssets.has(asset.id) ? 'ring-2 ring-primary' : ''}`}>
               <CardContent className="p-4 space-y-3">
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedAssets.has(asset.id)}
                        onCheckedChange={() => toggleSelection(asset.id)}
                        className="bg-background"
                      />
                    </div>
                  )}
                  
                  {/* Thumbnail */}
                  <div 
                    className="aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform relative"
                    onClick={() => isSelectionMode ? toggleSelection(asset.id) : handleAssetClick(asset)}
                  >
                    {asset.type.startsWith('image/') ? (
                      <img 
                        src={asset.url} 
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.type.startsWith('video/') ? (
                      <div className="relative w-full h-full">
                        <video 
                          src={asset.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      </div>
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
                         <DropdownMenuItem onClick={() => copyUrl(asset.url)}>
                           <Copy className="w-4 h-4 mr-2" />
                           Copy URL
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => toggleRotation(asset)}>
                           <RotateCcw className="w-4 h-4 mr-2" />
                           {asset.rotation_enabled ? 'Remove from' : 'Add to'} rotation
                         </DropdownMenuItem>
                         <DropdownMenuItem>
                           <Edit className="w-4 h-4 mr-2" />
                           Rename
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem 
                           className="text-destructive" 
                           onClick={() => deleteAsset(asset)}
                         >
                           <Trash2 className="w-4 h-4 mr-2" />
                           Delete
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                   <div className="flex items-center justify-between text-xs text-muted-foreground">
                     <span>{formatFileSize(asset.size)}</span>
                     <div className="flex items-center space-x-1">
                       {getFileIcon(asset.type)}
                       <span>{asset.type.split('/')[0]}</span>
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">
                       {new Date(asset.created_at).toLocaleDateString()}
                     </span>
                     {asset.rotation_enabled && (
                       <Badge variant="default" className="text-xs">
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
      {!loading && viewMode === 'list' && filteredAssets.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
               {filteredAssets.map((asset) => (
                 <div key={asset.id} className={`p-4 flex items-center space-x-4 hover:bg-secondary/30 transition-colors ${selectedAssets.has(asset.id) ? 'bg-primary/10' : ''}`}>
                   {/* Selection Checkbox */}
                   {isSelectionMode && (
                     <Checkbox
                       checked={selectedAssets.has(asset.id)}
                       onCheckedChange={() => toggleSelection(asset.id)}
                     />
                   )}
                   
                   <div 
                     className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                     onClick={() => isSelectionMode ? toggleSelection(asset.id) : handleAssetClick(asset)}
                   >
                     {getFileIcon(asset.type)}
                   </div>
                   
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatFileSize(asset.size)} • {new Date(asset.created_at).toLocaleDateString()}</p>
                    </div>
                   
                   <div className="flex items-center space-x-2">
                     {asset.rotation_enabled && (
                       <Badge variant="default" className="text-xs">
                         In Rotation
                       </Badge>
                     )}
                     <Button 
                       variant="ghost" 
                       size="sm"
                       onClick={() => copyUrl(asset.url)}
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
                         <DropdownMenuItem onClick={() => toggleRotation(asset)}>
                           <RotateCcw className="w-4 h-4 mr-2" />
                           {asset.rotation_enabled ? 'Remove from' : 'Add to'} rotation
                         </DropdownMenuItem>
                         <DropdownMenuItem>
                           <Edit className="w-4 h-4 mr-2" />
                           Rename
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem 
                           className="text-destructive"
                           onClick={() => deleteAsset(asset)}
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
      {!loading && filteredAssets.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Best results:</strong> Upload 75+ photos/videos for optimal content rotation. 
            Current library: {filteredAssets.length} assets ({filteredAssets.filter(a => a.rotation_enabled).length} in rotation)
          </p>
         </div>
       )}

       {/* Media Viewer */}
       <MediaViewer
         asset={selectedAsset}
         isOpen={isViewerOpen}
         onClose={() => {
           setIsViewerOpen(false);
           setSelectedAsset(null);
         }}
       />
     </div>
   );
 };

 export default Library;