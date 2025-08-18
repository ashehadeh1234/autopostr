# Social Media Manager - Developer Guide

## Overview

This is a comprehensive guide for developers working on the Social Media Manager application. The codebase has been recently refactored (Phase 1-5) for better maintainability, modularity, and developer experience.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui with Radix primitives
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **State Management**: React hooks and context

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── ConnectionCard.tsx, etc.
├── constants/           # Application constants and configurations
│   └── platforms.ts     # Social media platform definitions
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
│   ├── useConnections.ts    # Connection management
│   └── useFacebookOAuth.ts  # Facebook OAuth flow
├── pages/              # Page components
├── utils/              # Utility functions
│   ├── connectionUtils.ts   # Database operations
│   ├── errorHandling.ts     # Error management
│   └── logger.ts           # Logging utilities
└── integrations/       # External service integrations
    └── supabase/       # Supabase client and types
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

## 📝 Code Organization & Patterns

### Component Structure
All components follow this pattern:
```typescript
/**
 * @fileoverview Component Description
 * Brief description of what this component does
 * @author Team Name
 * @version 2.0
 */

// Imports organized by: React, UI components, utilities, types
import React from 'react';
import { Component } from '@/components/ui/component';
import { utility } from '@/utils/utility';
import { Type } from '@/types/type';

/**
 * Props interface with JSDoc comments
 */
interface ComponentProps {
  /** Description of prop */
  prop: string;
}

/**
 * Component documentation with examples
 */
export const Component: React.FC<ComponentProps> = ({ prop }) => {
  // Component logic
  return <div>{prop}</div>;
};
```

### Hook Structure
Custom hooks follow this pattern:
```typescript
/**
 * @fileoverview Hook Description
 * @author Team Name  
 * @version 2.0
 */

/**
 * Hook documentation with usage examples
 */
export const useCustomHook = () => {
  // Hook logic with proper documentation
  
  return {
    // Documented return values
  };
};
```

### Utility Structure
Utilities follow this pattern:
```typescript
/**
 * @fileoverview Utility Description
 * @author Team Name
 * @version 2.0
 */

/**
 * Utility object/class with comprehensive documentation
 */
export const utilityName = {
  /**
   * Method documentation with examples
   */
  methodName: async (param: string) => {
    // Implementation
  }
};
```

## 🔗 Social Media Connections

### Adding a New Platform

1. **Update Platform Configuration** (`src/constants/platforms.ts`):
```typescript
{
  id: "platform-name",
  name: "Platform Name", 
  platform: "platform-name",
  icon: PlatformIcon,
  connected: false,
  enabled: true,
  description: "Platform description",
  color: "hsl(xxx, xx%, xx%)"
}
```

2. **Create OAuth Edge Function** (`supabase/functions/platform-oauth/index.ts`):
```typescript
// Follow the facebook-oauth pattern
// Implement authentication flow
// Handle callback processing
```

3. **Create Hook for OAuth** (`src/hooks/usePlatformOAuth.ts`):
```typescript
// Follow the useFacebookOAuth pattern
// Handle connection flow
// Manage loading states
```

4. **Update Database Schema** (if needed):
```sql
-- Add platform-specific fields to social_connections
-- Update RLS policies
```

### Connection Flow
1. User clicks "Connect" on platform card
2. `usePlatformOAuth` hook initiates OAuth flow
3. Edge function handles OAuth redirect and token exchange
4. Connection data stored in `social_connections` table
5. UI updates to show connected state

## 🛠️ Utilities Deep Dive

### Connection Utils (`src/utils/connectionUtils.ts`)
Simple utilities for database operations:
- `loadSocialConnections(userId)` - Fetch user's connections
- `testConnection(connectionId)` - Verify connection health  
- `disconnectPlatform(userId, platform)` - Disconnect platform

### Error Handling (`src/utils/errorHandling.ts`)
Centralized error management:
- Categorizes errors by type (network, auth, facebook, etc.)
- Assigns severity levels
- Provides user-friendly messages
- Generates unique error IDs for tracking

### Logger (`src/utils/logger.ts`)
Simple logging with environment awareness:
- Development vs production filtering
- Automatic timestamps
- Multiple log levels (debug, info, warn, error)

## 🎨 Design System

### Color System
Use semantic tokens from `src/index.css`:
```css
/* Use these instead of hardcoded colors */
--primary: xxx xxx xxx;
--secondary: xxx xxx xxx;
--accent: xxx xxx xxx;
```

### Component Styling
- Use Tailwind utility classes
- Leverage shadcn/ui component variants
- Follow the design token system
- Ensure dark/light mode compatibility

## 🐛 Debugging

### Available Tools
1. **Console Logs**: Use `lov-read-console-logs` tool
2. **Network Requests**: Use `lov-read-network-requests` tool  
3. **Database Queries**: Use Supabase dashboard
4. **Edge Function Logs**: Check Supabase logs

### Common Issues
- **OAuth Redirects**: Check CORS headers in edge functions
- **Database Errors**: Verify RLS policies
- **UI State**: Check React DevTools
- **Styling**: Verify design token usage

## 📊 Database Schema

### Core Tables
- `social_connections` - User platform connections
- `schedules` - Scheduled posts
- `media_assets` - Uploaded media files

### Key Relationships
- Users ↔ SocialConnections (1:many)
- Users ↔ Schedules (1:many)
- Schedules ↔ MediaAssets (many:many)

## 🚀 Deployment

### Edge Functions
- Automatically deployed with code changes
- Check `supabase/config.toml` for configuration
- Monitor logs in Supabase dashboard

### Frontend
- Deployed via Lovable.dev
- Environment variables managed in project settings
- Custom domains configurable

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] OAuth flows for each platform
- [ ] Connection state management
- [ ] Error handling scenarios
- [ ] Responsive design
- [ ] Dark/light mode switching

### Error Scenarios to Test
- [ ] Network failures during OAuth
- [ ] Invalid tokens
- [ ] Platform API errors
- [ ] Database connection issues

## 🔒 Security Considerations

### OAuth Security
- Use PKCE for OAuth flows
- Validate state parameters
- Secure token storage
- Implement proper CORS

### Database Security
- Row Level Security (RLS) enabled
- Proper permission policies
- Input validation
- SQL injection prevention

## 📈 Performance Optimization

### Frontend
- Lazy load components
- Optimize bundle size
- Use React.memo for expensive components
- Minimize re-renders

### Backend
- Efficient database queries
- Proper indexing
- Edge function optimization
- Caching strategies

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript strictly
- Follow existing naming conventions
- Add comprehensive JSDoc comments
- Write self-documenting code

### Git Workflow
1. Create feature branch from main
2. Make focused, atomic commits
3. Add descriptive commit messages
4. Submit PR with detailed description

### Review Checklist
- [ ] Code follows established patterns
- [ ] Comprehensive documentation added
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Note**: This codebase has undergone significant refactoring (Phases 1-5) to improve maintainability. All code follows the established patterns and documentation standards outlined in this guide.