import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface MediaViewerProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  asset,
  isOpen,
  onClose,
}) => {
  if (!asset) return null;

  const isImage = asset.type.startsWith('image/');
  const isVideo = asset.type.startsWith('video/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center w-full h-full min-h-[80vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Media content */}
          <div className="flex items-center justify-center w-full h-full p-6">
            {isImage && (
              <img
                src={asset.url}
                alt={asset.name}
                className="max-w-full max-h-full object-contain animate-scale-in"
                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
              />
            )}
            
            {isVideo && (
              <video
                src={asset.url}
                controls
                className="max-w-full max-h-full animate-scale-in"
                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                autoPlay
              />
            )}
            
            {!isImage && !isVideo && (
              <div className="text-white text-center">
                <p className="text-lg mb-2">Preview not available</p>
                <p className="text-sm text-white/70">{asset.name}</p>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="absolute bottom-4 left-4 text-white/90">
            <p className="text-sm font-medium">{asset.name}</p>
            <p className="text-xs text-white/70">
              {(asset.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};