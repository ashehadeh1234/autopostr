/**
 * @fileoverview Platform Definitions and Types
 * 
 * Defines the structure and configuration for all supported social media
 * platforms. This is the single source of truth for platform information.
 * 
 * @author Social Media Manager Team
 * @version 2.0 - Extracted from components
 */

import { Twitter, Instagram, Linkedin, Youtube, Facebook } from "lucide-react";

/**
 * Represents a social media platform connection configuration.
 * Used for UI display and connection management.
 */
export interface Connection {
  /** Unique identifier for the platform */
  id: string;
  /** Display name of the platform */
  name: string;
  /** Platform identifier used in database */
  platform: string;
  /** React icon component for the platform */
  icon: React.ComponentType<any>;
  /** Whether user is currently connected to this platform */
  connected: boolean;
  /** Whether auto-posting is enabled for this platform */
  enabled: boolean;
  /** Description text shown in the UI */
  description: string;
  /** Brand color for the platform */
  color: string;
  /** Connected pages/accounts (for platforms like Facebook) */
  pages?: Array<{ pageId: string; pageName: string; permissions: string[] }>;
}

/**
 * Represents an active social media connection stored in the database.
 * This is the database model for social_connections table.
 */
export interface SocialConnection {
  /** Database record ID */
  id: string;
  /** Platform identifier (facebook, twitter, etc.) */
  platform: string;
  /** User ID on the platform */
  platform_user_id: string;
  /** Username on the platform */
  platform_username: string;
  /** Page/account ID on the platform */
  page_id: string;
  /** Page/account name on the platform */
  page_name: string;
  /** Whether this connection is currently active */
  is_active: boolean;
  /** Permissions granted by the user */
  permissions: string[];
}

/**
 * Complete list of supported social media platforms.
 * 
 * This array serves as the master configuration for all platforms
 * supported by the application. Each platform includes:
 * - Visual branding (icon, color)
 * - Default states (connected: false, enabled: true)
 * - User-facing information (name, description)
 * 
 * To add a new platform:
 * 1. Add the platform configuration here
 * 2. Implement OAuth flow in edge functions
 * 3. Add posting functionality
 * 4. Update database schema if needed
 */
export const PLATFORMS: Connection[] = [
  {
    id: "facebook",
    name: "Facebook",
    platform: "facebook",
    icon: Facebook,
    connected: false,
    enabled: true,
    description: "Connect your Facebook account and pages",
    color: "hsl(221, 83%, 53%)"
  },
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
];