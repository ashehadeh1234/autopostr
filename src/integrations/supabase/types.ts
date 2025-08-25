export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          ad_account_id: string
          created_at: string | null
          currency: string
          is_default: boolean | null
          name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_account_id: string
          created_at?: string | null
          currency?: string
          is_default?: boolean | null
          name: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_account_id?: string
          created_at?: string | null
          currency?: string
          is_default?: boolean | null
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          id: string
          name: string
          rotation_enabled: boolean
          size: number
          storage_path: string
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rotation_enabled?: boolean
          size: number
          storage_path: string
          type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rotation_enabled?: boolean
          size?: number
          storage_path?: string
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          author_name: string
          author_type: string
          created_at: string | null
          created_at_fb: string
          id: string
          is_hidden: boolean | null
          is_liked: boolean | null
          last_action: Json | null
          message: string
          page_id: string
          parent_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["comment_status"] | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          author_type?: string
          created_at?: string | null
          created_at_fb: string
          id: string
          is_hidden?: boolean | null
          is_liked?: boolean | null
          last_action?: Json | null
          message: string
          page_id: string
          parent_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["comment_status"] | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          author_type?: string
          created_at?: string | null
          created_at_fb?: string
          id?: string
          is_hidden?: boolean | null
          is_liked?: boolean | null
          last_action?: Json | null
          message?: string
          page_id?: string
          parent_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["comment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "fb_pages"
            referencedColumns: ["page_id"]
          },
        ]
      }
      fb_pages: {
        Row: {
          created_at: string | null
          is_default: boolean | null
          name: string
          page_access_token_encrypted: string | null
          page_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_default?: boolean | null
          name: string
          page_access_token_encrypted?: string | null
          page_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_default?: boolean | null
          name?: string
          page_access_token_encrypted?: string | null
          page_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ig_accounts: {
        Row: {
          created_at: string | null
          ig_user_id: string
          is_default: boolean | null
          page_id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          ig_user_id: string
          is_default?: boolean | null
          page_id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          ig_user_id?: string
          is_default?: boolean | null
          page_id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "ig_accounts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "fb_pages"
            referencedColumns: ["page_id"]
          },
        ]
      }
      page_connections: {
        Row: {
          created_at: string
          id: string
          ig_user_id: string | null
          page_access_token_encrypted: string
          page_id: string
          page_name: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ig_user_id?: string | null
          page_access_token_encrypted: string
          page_id: string
          page_name: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ig_user_id?: string | null
          page_access_token_encrypted?: string
          page_id?: string
          page_name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_executions: {
        Row: {
          created_at: string
          error_message: string | null
          executed_at: string
          id: string
          n8n_execution_id: string | null
          schedule_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          n8n_execution_id?: string | null
          schedule_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          n8n_execution_id?: string | null
          schedule_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_executions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          link_url: string | null
          media_url: string | null
          message: string | null
          published_at: string | null
          result_json: Json | null
          run_at: string
          status: Database["public"]["Enums"]["post_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["post_target_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          message?: string | null
          published_at?: string | null
          result_json?: Json | null
          run_at: string
          status?: Database["public"]["Enums"]["post_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["post_target_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          message?: string | null
          published_at?: string | null
          result_json?: Json | null
          run_at?: string
          status?: Database["public"]["Enums"]["post_status"] | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["post_target_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          interval_unit: string
          interval_value: number
          is_active: boolean
          last_executed_at: string | null
          name: string
          next_execution_at: string | null
          time_between_posts: number
          time_between_unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          interval_unit?: string
          interval_value?: number
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          next_execution_at?: string | null
          time_between_posts?: number
          time_between_unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          interval_unit?: string
          interval_value?: number
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          next_execution_at?: string | null
          time_between_posts?: number
          time_between_unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          id: string
          is_active: boolean
          page_access_token_encrypted: string | null
          page_id: string | null
          page_name: string | null
          permissions: string[] | null
          platform: string
          platform_user_id: string
          platform_username: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token_encrypted?: string | null
          page_id?: string | null
          page_name?: string | null
          permissions?: string[] | null
          platform: string
          platform_user_id: string
          platform_username?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token_encrypted?: string | null
          page_id?: string | null
          page_name?: string | null
          permissions?: string[] | null
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      encrypt_token: {
        Args: { plaintext_token: string }
        Returns: string
      }
      generate_token_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_decrypted_access_token: {
        Args: { connection_id: string }
        Returns: string
      }
      get_decrypted_page_access_token: {
        Args: { p_page_id: string }
        Returns: string
      }
      get_decrypted_page_token: {
        Args: { connection_id: string }
        Returns: string
      }
      get_random_media_asset: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          size: number
          type: string
          url: string
        }[]
      }
      get_user_role_in_workspace: {
        Args: { workspace_id_param: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_workspace_member: {
        Args: { user_id_param?: string; workspace_id_param: string }
        Returns: boolean
      }
      migrate_existing_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "staff"
      comment_status: "open" | "replied" | "hidden" | "deleted"
      post_status: "queued" | "published" | "failed"
      post_target_type: "facebook_page" | "instagram"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "staff"],
      comment_status: ["open", "replied", "hidden", "deleted"],
      post_status: ["queued", "published", "failed"],
      post_target_type: ["facebook_page", "instagram"],
    },
  },
} as const
