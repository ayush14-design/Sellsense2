# SellSense - Zomato Integration Guide

## Overview

This document describes the complete Zomato integration for SellSense, enabling restaurant owners to connect their Zomato accounts and automatically sync reviews for AI-powered analysis.

## Architecture

```
┌─────────────────┐     OAuth 2.0      ┌──────────────┐
│   SellSense     │ ─────────────────▶ │    Zomato    │
│   Frontend      │                    │   OAuth      │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         │ Authorization Code                 │
         │◀───────────────────────────────────│
         │                                    │
         ▼                                    ▼
┌─────────────────┐                    ┌──────────────┐
│   Backend API   │ ◀─────────────────▶ │  Zomato API  │
│  (Node/Express) │   Access Token      │  (Reviews,   │
└─────────────────┘                    │  Restaurants)│
                                       └──────────────┘
```

## Features

### 1. **OAuth 2.0 Authentication**
- Secure authorization flow with PKCE support
- Automatic token refresh
- State parameter for CSRF protection
- Token expiration handling

### 2. **Restaurant Discovery**
- Fetch user's managed restaurants from Zomato
- Search restaurants by name/location
- Display ratings, cuisine, cost, photos

### 3. **Review Synchronization**
- Pull reviews from Zomato API
- Automatic sentiment analysis
- Theme extraction
- Platform comparison

### 4. **Dual Mode Support**
- **Demo Mode**: Works out-of-the-box with mock data
- **Live Mode**: Real Zomato API integration with credentials

## Setup Instructions

### 1. Get Zomato API Credentials

1. Go to [Zomato Developers](https://developers.zomato.com/api)
2. Create an application
3. Note down:
   - Client ID
   - Client Secret
   - Configure Redirect URI: `https://yourdomain.com/zomato-connect`

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Zomato API Configuration
VITE_ZOMATO_CLIENT_ID=your_client_id
VITE_ZOMATO_CLIENT_SECRET=your_client_secret
VITE_ZOMATO_REDIRECT_URI=https://yourdomain.com/zomato-connect
VITE_ZOMATO_API_KEY=your_api_key
```

### 3. Backend Setup (Required for Production)

The frontend-only demo works for testing, but production requires a backend for:

- Secure token storage (refresh tokens)
- Server-to-server API calls
- Webhook handling for real-time updates
- Rate limiting & caching

#### Backend Endpoints Needed:

```
POST   /api/integrations/zomato/connect     - Exchange code for tokens
DELETE /api/integrations/zomato/:restaurantId - Disconnect
GET    /api/integrations/zomato/:restaurantId/status - Connection status
POST   /api/integrations/zomato/:restaurantId/sync - Trigger review sync
GET    /api/sync-jobs/:jobId                - Check sync status
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173/zomato-connect` to test the flow.

## User Flow

### For Restaurant Owners:

1. **Landing Page** → Click "Connect Zomato"
2. **Zomato Connect Page** → Click "Connect to Zomato"
3. **Zomato OAuth** → Authorize SellSense access
4. **Restaurant Selection** → Choose from their Zomato restaurants
5. **Configuration** → Enter owner details, business type
6. **Complete** → Redirected to dashboard with synced data

### For Developers:

1. User clicks "Connect to Zomato" 
2. `zomatoApi.getAuthorizationUrl()` generates OAuth URL with state
3. User redirected to Zomato authorization page
4. Zomato redirects back to `/zomato-connect?code=xxx&state=xxx`
5. `zomatoApi.handleCallback(code, state)` exchanges code for tokens
6. Tokens stored in localStorage (demo) or sent to backend (production)
7. `zomatoApi.fetchUserRestaurants()` retrieves restaurant list
8. User selects restaurant
9. Restaurant data saved via `authStorage.setRestaurant()`
10. Reviews synced via `zomatoApi.syncReviews(restaurantId)`

## Key Files

| File | Purpose |
|------|---------|
| `src/services/zomatoApi.ts` | Main Zomato API service (OAuth, REST calls) |
| `src/services/zomatoTypes.ts` | TypeScript types for Zomato API |
| `src/services/backendApi.ts` | Backend API service for production |
| `src/pages/ZomatoConnectPage.tsx` | 4-step connection UI |
| `src/pages/SetupPage.tsx` | Updated to redirect Zomato to dedicated page |
| `src/components/Navbar.tsx` | Added "Connect Zomato" link |

## API Reference

### zomatoApi Methods

```typescript
// Initialize with credentials
zomatoApi.initialize(config: ZomatoConfig)

// OAuth
zomatoApi.getAuthorizationUrl(state?: string): string
zomatoApi.handleCallback(code: string, state: string): Promise<ZomatoTokens>
zomatoApi.disconnect(): void
zomatoApi.isConnected(): boolean
zomatoApi.getConnectionInfo(): { connected, demoMode, expiresAt }

// Data fetching
zomatoApi.fetchUserRestaurants(): Promise<ZomatoRestaurant[]>
zomatoApi.searchRestaurants(query: string, lat?, lon?): Promise<ZomatoRestaurant[]>
zomatoApi.fetchRestaurantDetails(id: string): Promise<ZomatoRestaurant>
zomatoApi.fetchRestaurantReviews(id: string, count?: number): Promise<ZomatoReview[]>
zomatoApi.fetchUserProfile(): Promise<ZomatoUserProfile>

// Sync
zomatoApi.syncReviews(restaurantId: string): Promise<{ success, count, error }>

// Conversion helpers
convertZomatoToRestaurant(zomatoRes): Restaurant
convertZomatoReviews(zomatoReviews, restaurantId): Review[]
```

## Demo vs Production

### Demo Mode (Default)
- No credentials needed
- Uses mock restaurant data (Nelam Restaurants, Spice Route Cafe)
- Mock reviews with varied sentiments
- All flows work end-to-end
- Data stored in localStorage only

### Production Mode
- Requires valid Zomato credentials in `.env.local`
- Real OAuth flow with Zomato
- Real restaurant data from user's account
- Real reviews from Zomato API
- Tokens securely stored
- Backend integration for persistence

## Testing Checklist

- [ ] Demo mode works without credentials
- [ ] OAuth flow initiates correctly
- [ ] Callback handles code/state properly
- [ ] Restaurant list displays with images/ratings
- [ ] Restaurant selection works
- [ ] Configuration form validates
- [ ] Completion redirects to dashboard
- [ ] Disconnect clears tokens
- [ ] Real mode works with valid credentials
- [ ] Token refresh works automatically
- [ ] Error handling for expired tokens
- [ ] Dark mode compatible

## Security Considerations

1. **Never expose Client Secret** in frontend code
2. **Use HTTPS** in production for redirect URIs
3. **Validate state parameter** to prevent CSRF
4. **Store refresh tokens** server-side only
5. **Implement rate limiting** on backend
6. **Encrypt sensitive data** at rest
7. **Regular token rotation** via refresh

## Troubleshooting

### "Invalid OAuth state"
- Clear localStorage: `localStorage.removeItem('zomato_oauth_state')`
- Check redirect URI matches exactly

### "Not connected to Zomato"
- Ensure credentials in `.env.local`
- Check browser console for initialization logs
- Verify `zomatoApi.getConnectionInfo().demoMode === false`

### "Failed to fetch restaurants"
- Check Zomato API key is valid
- Verify user owns restaurants on Zomato
- Check network tab for API errors

### Token expired
- User must reconnect (automatic redirect)
- Backend should handle refresh transparently

## Future Enhancements

- [ ] Swiggy API integration
- [ ] Google Business Profile API integration
- [ ] Webhook support for real-time review updates
- [ ] Multi-restaurant management
- [ ] Team member access controls
- [ ] White-label OAuth for agencies
- [ ] Review response posting via API

## Support

For Zomato API issues: [Zomato Developer Support](https://developers.zomato.com/support)

For SellSense integration issues: Check browser console and network tab for detailed errors.