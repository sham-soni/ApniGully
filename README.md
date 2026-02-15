# ApniGully - Micro-Community Platform for Indian Neighborhoods

ApniGully is a production-ready micro-community platform designed specifically for Indian neighborhoods (gullys). It enables residents to connect, share, and build trusted local communities.

## Features

### Core Features
- **Neighborhoods (Gullys)**: Create and join local neighborhood communities
- **Feed**: Share updates, alerts, events, recommendations, questions, rentals, and lost & found
- **Directory**: Find local helpers, shops, and rental listings
- **Messaging**: Real-time chat with neighbors, helpers, and shop owners
- **Trust & Verification**: OTP-based phone verification and community endorsements

### Next-Gen Features (6+ Implemented)
1. **Trust Graph**: Visual trust score based on verification, endorsements, and activity
2. **Task-to-Review Linking**: Only verified task completions generate reviews
3. **Auto-Structured Posts**: AI-free NLP parsing for rental listings (BHK, rent, deposit, amenities)
4. **Smart Digest**: Personalized daily/weekly neighborhood summaries
5. **Safety Mode**: Emergency alerts, check-ins, and panic button
6. **Offline-First Sync**: Queue operations when offline, sync when back online
7. **Local Deals**: Time-limited offers from neighborhood shops
8. **Micro-Groups**: Interest-based sub-communities within neighborhoods

## Tech Stack

### Frontend
- **Web**: Next.js 14, React 18, TypeScript, Tailwind CSS, SWR
- **Mobile**: React Native (Expo), TypeScript

### Backend
- **API**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io WebSockets
- **Storage**: S3-compatible (AWS S3 / MinIO)

### Architecture
- **Monorepo**: npm workspaces
- **Shared packages**: Types, schemas, utilities, UI components

## Project Structure

```
apnigully/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js web app
│   └── mobile/       # React Native (Expo) app
├── packages/
│   ├── shared/       # Shared types, schemas, utils
│   └── ui/           # Design tokens (shared across web/mobile)
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repo-url>
cd apnigully
npm install
```

2. **Set up environment variables**:
```bash
# Copy example env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update with your values (or use defaults for local dev)
```

3. **Start infrastructure with Docker**:
```bash
docker-compose up -d postgres redis minio
```

4. **Run database migrations**:
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

5. **Start the development servers**:
```bash
# From root directory
npm run dev
```

This starts:
- API: http://localhost:4000
- Web: http://localhost:3000
- API Docs: http://localhost:4000/api/docs

### Running Mobile App

```bash
cd apps/mobile
npm start
# Scan QR with Expo Go app on your phone
```

### Docker Compose (Full Stack)

For production-like environment:
```bash
docker-compose up -d
```

This starts all services including API, Web, and infrastructure.

## API Documentation

Swagger docs available at `/api/docs` when running the API.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/send-otp` | Request OTP for phone number |
| `POST /auth/verify-otp` | Verify OTP and get JWT |
| `GET /posts` | Get feed posts |
| `POST /posts` | Create a new post |
| `GET /helpers` | List helper profiles |
| `GET /shops` | List shops |
| `GET /rentals` | List rental listings |
| `GET /chats` | Get user's chat conversations |
| `WS /chat` | WebSocket namespace for real-time messaging |

## Database Schema

Key models:
- **User**: Phone-based auth, trust score, roles
- **Neighborhood**: Community with members, buildings
- **Post**: 7 types (update, alert, event, recommendation, question, rental, lost_found)
- **HelperProfile**: Service providers with endorsements
- **Shop**: Local businesses with offers
- **RentalListing**: Property listings with auto-parsed data
- **Chat/Message**: Real-time messaging with read receipts
- **Review**: Verified reviews linked to completed tasks
- **Report/ModerationAction**: Content moderation system

## Key Design Decisions

### Trust Score Algorithm
```
Trust Score =
  + 20 (if verified)
  + (endorsements × 2, max 30)
  + (positive reviews × 3)
  - (negative reviews × 5)
  - (report count × 10)
  + (account age bonus, max 10)
```

### Auto-Parsing Rental Posts
Deterministic NLP parsing without AI:
- Detects BHK type (1BHK, 2BHK, 3BHK, etc.)
- Extracts rent amount (₹25k, 25000, etc.)
- Identifies deposit/advance
- Recognizes furnishing status
- Detects amenities (parking, lift, gym, etc.)

### Offline-First Architecture
- All write operations queue locally when offline
- Automatic sync when connection restored
- Conflict resolution: last-write-wins with timestamps

## Demo Accounts

After seeding the database:

| Phone | OTP | Role |
|-------|-----|------|
| +919999999999 | 123456 | Admin |
| +919999999998 | 123456 | Resident |
| +919999999997 | 123456 | Helper |
| +919999999996 | 123456 | Shop Owner |

*Dev mode: OTP 123456 works for all phone numbers*

## Scripts

```bash
# Root level
npm run dev           # Start all apps in development
npm run build         # Build all apps
npm run lint          # Lint all packages

# API
cd apps/api
npm run start:dev     # Development with hot reload
npm run start:prod    # Production build
npm run migrate       # Run Prisma migrations
npm run seed          # Seed demo data

# Web
cd apps/web
npm run dev           # Development server
npm run build         # Production build

# Mobile
cd apps/mobile
npm start             # Expo development server
npm run android       # Android development
npm run ios           # iOS development (macOS only)
```

## Environment Variables

### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
JWT_EXPIRY=7d
PORT=4000
CORS_ORIGINS=http://localhost:3000
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=apnigully-uploads
S3_ENDPOINT=http://localhost:9000
```

### Web (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

---

Built with care for Indian neighborhoods
