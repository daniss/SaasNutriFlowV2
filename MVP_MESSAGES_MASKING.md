# MVP Feature Masking - Multiple Features

## Overview

Multiple features have been temporarily masked for the MVP release. These features will be added in future versions.

## What was masked:

### 1. Messages Functionality

#### Dashboard Sidebar Navigation

- **File**: `components/app-sidebar.tsx`
- **Change**: Commented out the Messages menu item in the navigation
- **Status**: Hidden from sidebar navigation

#### Client Portal Navigation

- **File**: `app/client-portal/page.tsx`
- **Changes**:
  - Commented out Messages tab in TabsList
  - Commented out Messages TabsContent component
  - Commented out ClientMessages import
  - Commented out messages interface property
- **Status**: Messages tab completely hidden from client portal

#### Messages Page Route

- **File**: `app/dashboard/messages/page.tsx`
- **Change**: Replaced entire functionality with a "feature disabled" page
- **Status**: Shows friendly message explaining feature is temporarily unavailable

#### API Data Endpoint

- **File**: `app/api/client-auth/data/route.ts`
- **Changes**:
  - Commented out conversation/messages database queries
  - Commented out messages data in response object
  - Set conversationMessages to empty array
- **Status**: API no longer fetches or returns message data

### 2. Rappels (Reminders) Functionality

#### Dashboard Sidebar Navigation

- **File**: `components/app-sidebar.tsx`
- **Change**: Commented out the Rappels menu item
- **Status**: Hidden from sidebar navigation

#### Reminders Page Route

- **File**: `app/dashboard/reminders/page.tsx`
- **Change**: Replaced entire functionality with a "feature disabled" page
- **Status**: Shows friendly message explaining feature is temporarily unavailable

### 3. Analyse nutritionnelle Functionality

#### Dashboard Sidebar Navigation

- **File**: `components/app-sidebar.tsx`
- **Change**: Commented out the Analyse nutritionnelle menu item
- **Status**: Hidden from sidebar navigation

#### Nutrition Analysis Page Route

- **File**: `app/dashboard/nutrition-analysis/page.tsx`
- **Change**: Replaced entire functionality with a "feature disabled" page
- **Status**: Shows friendly message explaining feature is temporarily unavailable

### 4. Portail Client Menu Item

#### Dashboard Sidebar Navigation

- **File**: `components/app-sidebar.tsx`
- **Change**: Commented out the Portail Client menu item
- **Status**: Hidden from nutritionist dashboard (clients can still access via /client-portal)
- **Note**: The actual client portal remains functional for clients, just removed from nutritionist menu

### 5. Settings Page - Unused Provider Configurations

#### Notification Providers Configuration

- **File**: `app/dashboard/settings/page.tsx`
- **Changes**:
  - Commented out entire "Configuration des fournisseurs de notification" section
  - Includes SendGrid API, Resend API, Twilio SMS, OVH SMS configurations
  - Includes payment providers (Stripe, PayPal) configurations
- **Status**: All third-party API configuration fields hidden from settings

#### Client Portal Customization

- **File**: `app/dashboard/settings/page.tsx`
- **Changes**:
  - Commented out "Personnalisation du portail client" section
  - Includes portal title, welcome message, brand colors configurations
- **Status**: Portal customization settings hidden (portal remains functional with defaults)

## How to Re-enable Features (Future Development)

## How to Re-enable Features (Future Development)

1. **Uncomment all masked sections** marked with:

   ```
   /* MASKED FOR MVP - [Feature name] functionality will be added in future
   ```

2. **Restore original files**:

   - Restore original `app/dashboard/messages/page.tsx` functionality
   - Restore original `app/dashboard/reminders/page.tsx` functionality
   - Restore original `app/dashboard/nutrition-analysis/page.tsx` functionality
   - Uncomment navigation items in sidebar
   - Uncomment API queries and responses

3. **Test all components**:
   - Messages: ClientMessages component, dashboard page, API endpoints
   - Reminders: Dashboard functionality, database relationships
   - Nutrition Analysis: Analysis tools, calculations, reporting
   - Client Portal: Restore Messages tab and functionality
   - Settings: Restore notification providers and client portal customization sections

## Notes

- All original code is preserved in comments
- No database schema changes were made
- Features can be quickly re-enabled by uncommenting
- User experience gracefully handles missing features with informative messages
- Client portal remains accessible for actual clients at `/client-portal`
- Only removed inappropriate menu items from nutritionist dashboard
- Settings page now focuses on core profile and security features only
