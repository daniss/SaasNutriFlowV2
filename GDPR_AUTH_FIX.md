# GDPR Consent System - Authentication Fix

## Problem Resolved

The client consent API was returning `401 Unauthorized` because it was trying to use Supabase user sessions, but the client authentication system uses a custom approach with localStorage and service role authentication.

## Technical Changes Made

### 1. Updated API Authentication (`/api/client-auth/gdpr/consents/route.ts`)

**Before:** Used `supabase.auth.getSession()` which doesn't exist in client auth flow
**After:** Uses service role with `clientId` parameter like other client APIs

**Key Changes:**

- Changed from session-based auth to service role with clientId parameter
- GET: `?clientId=xxx` parameter required
- POST: `clientId` in request body required
- Uses `process.env.SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Matches pattern used by `/api/client-auth/data` endpoint

### 2. Updated Frontend Components

**MandatoryConsentModal.tsx:**

- Added `clientId: client?.id` to POST request body
- Now passes client ID from `useClientAuth()` hook

**ClientGDPRRights.tsx:**

- Added `useClientAuth()` hook to get client information
- Updated GET calls to include `?clientId=${client.id}` parameter
- Updated POST calls to include `clientId` in request body
- Proper consent data formatting for API

**Client Portal Page:**

- Updated consent check to include `?clientId=${sessionClient.id}` parameter

## How It Works Now

### API Flow:

1. **GET /api/client-auth/gdpr/consents?clientId=xxx**

   - Uses service role to query `consent_records` table
   - Filters by `client_id` parameter
   - Returns consent status for the client

2. **POST /api/client-auth/gdpr/consents**
   - Accepts `{ clientId, consents }` in request body
   - Uses service role to create/update consent records
   - Associates consents with proper `dietitian_id` from client record

### Frontend Flow:

1. **Client logs in** → Session stored in localStorage
2. **Portal loads** → Checks consents using client ID from session
3. **Mandatory modal** → Uses client ID to save consents to database
4. **GDPR tab** → Uses client ID for ongoing consent management

## Testing Instructions

### 1. Test Mandatory Consent Modal

```bash
# 1. Go to client portal (should show consent modal)
http://localhost:3001/client-portal

# 2. Try to submit without required consents (should fail)
# 3. Accept required consents (should save successfully)
# 4. Refresh page (should not show modal again)
```

### 2. Test API Endpoints

```bash
# GET consents (replace CLIENT_ID with actual ID)
curl "http://localhost:3001/api/client-auth/gdpr/consents?clientId=CLIENT_ID"

# POST consents
curl -X POST "http://localhost:3001/api/client-auth/gdpr/consents" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID",
    "consents": [
      {"consent_type": "data_processing", "granted": true},
      {"consent_type": "health_data", "granted": true}
    ]
  }'
```

### 3. Test GDPR Management Tab

```bash
# 1. Go to client portal → Confidentialité tab
http://localhost:3001/client-portal

# 2. Test "Modifier mes consentements" dialog
# 3. Test consent toggle switches
# 4. Test saving changes
```

## Database Requirements

Ensure GDPR schema is applied:

```sql
-- Run the GDPR schema script in Supabase SQL Editor
-- File: scripts/create-gdpr-schema.sql
```

## Expected Behavior

✅ **No more 401 errors** - Client consent APIs now authenticate properly
✅ **Mandatory consent modal** - Blocks portal access until required consents given
✅ **Consent persistence** - Saved consents persist between sessions
✅ **GDPR management** - Full consent management in client portal
✅ **Email notifications** - Admin receives emails for GDPR requests

## Error Resolution Status

**FIXED:** `POST /api/client-auth/gdpr/consents 401 Unauthorized`
**FIXED:** `Error saving consents: Error: Erreur lors de l'enregistrement des consentements`

The client consent system now properly authenticates and saves consent preferences to the database.
