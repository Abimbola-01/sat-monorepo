# Qorvi Deployment Guide

## Prerequisites

### Environment Variables

Create a `.env` file in `apps/api/` with the following:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qorvi
DB_USER=qorvi
DB_PASSWORD=your_secure_password

# Clerk (Authentication)
CLERK_SECRET_KEY=your_clerk_secret_key

# Application
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-domain.com
```

### Database Setup

1. **Create PostgreSQL database:**
```sql
CREATE DATABASE qorvi;
CREATE USER qorvi WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qorvi TO qorvi;
```

2. **Run migrations on first deploy:**
The app automatically runs migrations on startup via `runMigrations()` in `src/index.ts`.

## Deployment Steps

### 1. Build the API

```bash
cd apps/api
npm install
npm run build
```

### 2. Verify Build Output

```bash
ls -la dist/
# Should contain compiled JavaScript files
```

### 3. Start the Server

```bash
npm start
```

The server will:
- Connect to PostgreSQL
- Run database migrations automatically
- Start listening on port 4000

### 4. Verify Health

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","message":"Qorvi Backend is running",...}

curl http://localhost:4000/health/db
# Expected: {"status":"ok","db_time":"..."}
```

## API Endpoints

### Authentication Required
All `/api/*` endpoints except `/health` require authentication via Clerk JWT.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (no auth) |
| `/api/health/db` | GET | Database connectivity check (no auth) |
| `/api/me` | GET | Current user info |
| `/api/imports/upload` | POST | Upload CSV for preview |
| `/api/imports/confirm` | POST | Confirm import |
| `/api/imports/:id/cancel` | POST | Cancel pending import |
| `/api/imports` | GET | List user's imports |
| `/api/transactions` | GET | List user's transactions |
| `/api/transactions/:id` | DELETE | Delete a transaction |
| `/api/transactions` | DELETE | Clear all transactions |
| `/api/subscriptions/detect` | POST | Run detection |
| `/api/subscriptions` | GET | List subscriptions |
| `/api/subscriptions/:id/confirm` | POST | Confirm subscription |
| `/api/subscriptions/:id/dismiss` | POST | Dismiss subscription |
| `/api/subscriptions/:id` | PATCH | Edit subscription |
| `/api/subscriptions/:id/inactive` | POST | Mark as inactive |
| `/api/subscriptions/:id` | DELETE | Delete subscription |
| `/api/dashboard` | GET | Dashboard metrics |
| `/api/insights` | GET | Spending insights |
| `/api/settings` | GET/PATCH | User settings |
| `/api/settings/data` | DELETE | Clear all user data |

## Frontend Configuration

In `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Database Schema Changes (v2)

The following columns were added to support the enhanced detection engine:

### subscriptions table
- `confidence_score INTEGER` - 0-100 confidence score
- `categories JSONB` - Array of category strings (e.g., ["Streaming"])
- `status TEXT DEFAULT 'needsReview'` - Changed from 'active'

### Existing tables unchanged
- users
- imports
- transactions
- subscription_occurrences
- user_settings

## Rollback Plan

If needed, rollback to previous version:

1. Revert code to previous commit
2. The schema changes are backward compatible (new columns are optional)
3. No data migration needed - existing subscriptions will have:
   - `confidence_score = 0`
   - `categories = '["Other"]'`
   - `status = 'needsReview'`

## Monitoring

### Logs
```bash
# Check application logs
journalctl -u qorvi-api -f

# Or if running in Docker
docker logs qorvi-api -f
```

### Health Checks
Set up monitoring for:
- `GET /health` - Application health
- `GET /health/db` - Database connectivity
```

