import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

export interface Connection {
  id: string;
  name: string;
  platform: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  enabled: boolean;
  description: string;
  color: string;
  pages?: Array<{ pageId: string; pageName: string; permissions: string[] }>;
}

export interface SocialConnection {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  permissions: string[];
}

export const PLATFORMS: Connection[] = [
  {
    id: "facebook",
    name: "Facebook",
    platform: "facebook",
    icon: Facebook,
    connected: false,
    enabled: true,
    description: "Post to your Facebook pages",
    color: "hsl(221, 44%, 41%)"
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