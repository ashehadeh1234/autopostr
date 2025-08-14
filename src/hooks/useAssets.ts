import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storage_path: string;
  rotation_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAssets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resizeImage = (file: File, maxSizeMB: number = 7): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions to keep aspect ratio
        let { width, height } = img;
        const maxDimension = 1920; // Max width/height for better compression
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Start with lower quality and iterate if needed
        let quality = 0.7;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const sizeInMB = blob.size / (1024 * 1024);
                if (sizeInMB <= maxSizeMB || quality <= 0.1) {
                  const resizedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(resizedFile);
                } else {
                  quality -= 0.1;
                  tryCompress();
                }
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<Asset | null> => {
    if (!user) return null;

    try {
      // Resize image if it's an image file and larger than 7MB
      let fileToUpload = file;
      if (file.type.startsWith('image/') && file.size > 7 * 1024 * 1024) {
        console.log(`Resizing image from ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        fileToUpload = await resizeImage(file);
        console.log(`Resized to ${(fileToUpload.size / (1024 * 1024)).toFixed(2)}MB`);
      }

      // Create unique file path
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("user-assets")
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { data, error: dbError } = await supabase
        .from("assets")
        .insert({
          user_id: user.id,
          name: file.name,
          type: fileToUpload.type,
          size: fileToUpload.size, // Use resized file size
          url: publicUrl,
          storage_path: filePath,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local state
      setAssets(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      return data;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAsset = async (asset: Asset) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("user-assets")
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("assets")
        .delete()
        .eq("id", asset.id);

      if (dbError) throw dbError;

      // Update local state
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    }
  };

  const toggleRotation = async (asset: Asset) => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .update({ rotation_enabled: !asset.rotation_enabled })
        .eq("id", asset.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAssets(prev => prev.map(a => a.id === asset.id ? data : a));
      
      toast({
        title: "Success",
        description: `Rotation ${data.rotation_enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error("Error toggling rotation:", error);
      toast({
        title: "Error",
        description: "Failed to update rotation setting",
        variant: "destructive",
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Success",
      description: "URL copied to clipboard",
    });
  };

  useEffect(() => {
    fetchAssets();
  }, [user]);

  const deleteMultipleAssets = async (assetIds: string[]) => {
    try {
      // Get assets for storage cleanup
      const assetsToDelete = assets.filter(asset => assetIds.includes(asset.id));
      
      // Delete from storage
      const storagePaths = assetsToDelete.map(asset => asset.storage_path);
      const { error: storageError } = await supabase.storage
        .from("user-assets")
        .remove(storagePaths);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("assets")
        .delete()
        .in("id", assetIds);

      if (dbError) throw dbError;

      // Update local state
      setAssets(prev => prev.filter(asset => !assetIds.includes(asset.id)));
      
      toast({
        title: "Success",
        description: `${assetIds.length} assets deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting multiple assets:", error);
      toast({
        title: "Error",
        description: "Failed to delete assets",
        variant: "destructive",
      });
    }
  };

  const toggleMultipleRotation = async (assetIds: string[], enable: boolean) => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .update({ rotation_enabled: enable })
        .in("id", assetIds)
        .select();

      if (error) throw error;

      // Update local state
      setAssets(prev => prev.map(asset => {
        const updatedAsset = data?.find(d => d.id === asset.id);
        return updatedAsset || asset;
      }));
      
      toast({
        title: "Success",
        description: `Rotation ${enable ? 'enabled' : 'disabled'} for ${assetIds.length} assets`,
      });
    } catch (error) {
      console.error("Error toggling multiple rotation:", error);
      toast({
        title: "Error",
        description: "Failed to update rotation settings",
        variant: "destructive",
      });
    }
  };

  const copyMultipleUrls = (assets: Asset[]) => {
    const urls = assets.map(asset => asset.url).join('\n');
    navigator.clipboard.writeText(urls);
    toast({
      title: "Success",
      description: `${assets.length} URLs copied to clipboard`,
    });
  };

  return {
    assets,
    loading,
    uploadFile,
    deleteAsset,
    toggleRotation,
    copyUrl,
    deleteMultipleAssets,
    toggleMultipleRotation,
    copyMultipleUrls,
    refetch: fetchAssets,
  };
};