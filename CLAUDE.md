# CLAUDE.md - Project Context for AI Assistance

## Project Overview

ApniGully is a micro-community platform for Indian neighborhoods. It's a full-stack monorepo with NestJS API, Next.js web app, and React Native mobile app.

## IMPORTANT: Fixed Port Configuration

**In development mode, ALWAYS use these exact ports. NEVER change or switch them:**

| Service | Port | URL |
|---------|------|-----|
| **API (NestJS)** | 4000 | http://localhost:4000 |
| **Web (Next.js)** | 3000 | http://localhost:3000 |
| **PostgreSQL** | 5555 | localhost:5555 |
| **Redis** | 6379 | localhost:6379 |

- The web app expects the API at port 4000
- The mobile app expects the API at port 4000
- Environment variables are configured for these ports
- **Do not suggest or use alternative ports**

## Repository Structure

```
ApniGully/
├── apps/
│   ├── api/                 # NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts      # Entry point
│   │   │   ├── app.module.ts # Root module
│   │   │   ├── prisma/      # Prisma service
│   │   │   └── modules/     # Feature modules
│   │   │       ├── auth/    # JWT authentication
│   │   │       ├── users/   # User management + settings
│   │   │       ├── posts/   # Feed posts (7 types)
│   │   │       ├── neighborhoods/ # Community management
│   │   │       ├── chats/   # Real-time messaging
│   │   │       ├── helpers/ # Service provider profiles
│   │   │       ├── shops/   # Local businesses
│   │   │       ├── rentals/ # Property listings
│   │   │       ├── notifications/ # Push + in-app notifications
│   │   │       ├── polls/   # Voting system
│   │   │       ├── events/  # Event RSVP system
│   │   │       ├── websocket/ # Socket.io gateway
│   │   │       └── ...
│   │   └── prisma/
│   │       └── schema.prisma # Database schema
│   │
│   ├── web/                 # Next.js 14 (port 3000)
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── contexts/    # React contexts (Auth, Theme, Language)
│   │   │   └── lib/         # Utilities (api, upload)
│   │   └── tailwind.config.ts
│   │
│   └── mobile/              # React Native (Expo)
│       ├── src/
│       │   ├── screens/     # App screens
│       │   ├── components/  # Shared components
│       │   ├── contexts/    # React contexts
│       │   ├── navigation/  # React Navigation
│       │   └── lib/         # Utilities (api, storage, upload)
│       └── App.tsx          # Entry point
│
├── packages/
│   ├── shared/              # Shared code
│   │   └── src/
│   │       ├── types/       # TypeScript interfaces
│   │       ├── schemas/     # Zod validation schemas
│   │       └── utils/       # Utility functions
│   └── ui/                  # Design tokens
│
├── docker-compose.yml       # PostgreSQL, Redis, MinIO
└── package.json             # Workspace root
```

## Key Commands

```bash
# Start all services
docker-compose up -d postgres redis

# API development
cd apps/api
npm run dev                  # Watch mode on port 4000
npm run build                # Build to dist/
npx prisma migrate dev       # Run migrations
npx prisma generate          # Regenerate client

# Web development
cd apps/web
npm run dev                  # Port 3000

# Mobile development
cd apps/mobile
npm start                    # Expo dev server
```

## Database

- **ORM**: Prisma with PostgreSQL
- **Connection**: `localhost:5555` (via Docker)
- **Key Models**:
  - `User` - Phone-based auth, trust score
  - `Neighborhood` - Community with memberships
  - `Post` - 7 types: update, alert, event, recommendation, question, rental, lost_found
  - `HelperProfile` - Service providers
  - `Shop` - Local businesses
  - `Chat/Message` - Real-time messaging
  - `Poll/PollOption/PollVote` - Voting system
  - `Event/EventRSVP` - Event management
  - `UserSettings` - Notification/privacy preferences
  - `BlockedUser` - User blocking

## API Architecture

- **Auth**: JWT tokens, phone OTP verification
- **Routes**: All prefixed with `/api/v1/`
- **Guards**: `JwtAuthGuard` for protected routes
- **Throttling**: 100 requests/minute
- **WebSocket**: Socket.io at root namespace
- **Docs**: Swagger at `/api/docs`

## Important Patterns

### Module Structure (NestJS)
Each module has:
- `*.module.ts` - Module definition
- `*.controller.ts` - HTTP routes
- `*.service.ts` - Business logic
- `dto/*.dto.ts` - Request validation

### API Client (Frontend)
```typescript
// apps/web/src/lib/api.ts or apps/mobile/src/lib/api.ts
import { api } from '@/lib/api';
await api.get('/users/me');
await api.post('/posts', data);
```

### Image Upload Pattern
```typescript
// Get signed URL, upload to S3, use returned URL
import { uploadImage } from '@/lib/upload';
const url = await uploadImage(file, 'posts');
```

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/apnigully
REDIS_URL=redis://localhost:6379
JWT_SECRET=apnigully-secret-key
JWT_EXPIRY=7d
PORT=4000
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Google Maps Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key
3. Enable these APIs: Maps JavaScript API, Places API, Geocoding API
4. Add the key to `apps/web/.env.local`

## Feature Flags

- **Dark Mode**: CSS variables in `globals.css`, ThemeContext
- **Push Notifications**: Firebase Admin SDK (requires FIREBASE_SERVICE_ACCOUNT)
- **Offline Sync**: Implemented in mobile with AsyncStorage queue

## Testing

```bash
cd apps/api
npm run test              # Unit tests
npm run test:e2e          # Integration tests
```

## Common Tasks

### Add a new API endpoint
1. Create/update controller method
2. Create DTO for validation
3. Implement service method
4. Update Swagger decorators

### Add a new screen (mobile)
1. Create screen in `src/screens/`
2. Add to `RootStackParamList` in navigation
3. Register in `RootNavigator.tsx`

### Add a new page (web)
1. Create `page.tsx` in `src/app/(app)/`
2. App Router automatically registers route

### Database changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Update services to use new fields

## GitHub Repository

https://github.com/sham-soni/ApniGully

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| API | NestJS, TypeScript, Prisma |
| Web | Next.js 14, React, Tailwind CSS |
| Mobile | React Native, Expo |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | S3 (AWS/MinIO) |
| Real-time | Socket.io |
| Auth | JWT, Phone OTP |
