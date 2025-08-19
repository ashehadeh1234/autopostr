import React from "react";
import { Badge } from "@/components/ui/badge";
import { Image, Video, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Asset {
  id?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storage_path?: string;
}

interface FilePreviewProps {
  assets: Asset[];
  onRemove?: (index: number) => void;
  showRemove?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  assets,
  onRemove,
  showRemove = false,
}) => {
  if (assets.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full mb-6">
      <h3 className="text-sm font-medium mb-3">Files to upload ({assets.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="relative group bg-card border border-border rounded-lg overflow-hidden hover:shadow-medium transition-smooth"
          >
            {/* Remove button */}
            {showRemove && onRemove && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 z-10 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {/* File preview */}
            <div className="aspect-square bg-muted flex items-center justify-center">
              {asset.type.startsWith('image/') ? (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : asset.type.startsWith('video/') ? (
                <video
                  src={asset.url}
                  className="w-full h-full object-cover"
                  muted
                  onError={(e) => {
                    // Fallback to icon if video fails to load
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground" />
              )}
              
              {/* Fallback icon (hidden by default) */}
              {asset.type.startsWith('image/') && (
                <Image className="w-8 h-8 text-muted-foreground hidden" />
              )}
              {asset.type.startsWith('video/') && (
                <Video className="w-8 h-8 text-muted-foreground hidden" />
              )}
            </div>

            {/* File info */}
            <div className="p-2 space-y-1">
              <p className="text-xs font-medium truncate" title={asset.name}>
                {asset.name}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs h-5">
                  {asset.type.startsWith('image/') && <Image className="w-2 h-2 mr-1" />}
                  {asset.type.startsWith('video/') && <Video className="w-2 h-2 mr-1" />}
                  {!asset.type.startsWith('image/') && !asset.type.startsWith('video/') && <FileText className="w-2 h-2 mr-1" />}
                  {asset.type.split('/')[0]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(asset.size)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};