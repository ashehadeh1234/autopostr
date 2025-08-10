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

  const uploadFile = async (file: File): Promise<Asset | null> => {
    if (!user) return null;

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(filePath, file);

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
          type: file.type,
          size: file.size,
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

  return {
    assets,
    loading,
    uploadFile,
    deleteAsset,
    toggleRotation,
    copyUrl,
    refetch: fetchAssets,
  };
};