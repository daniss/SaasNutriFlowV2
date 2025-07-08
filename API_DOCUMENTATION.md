# 📚 NutriFlow API Documentation

This document provides comprehensive documentation for the NutriFlow API endpoints, authentication, and integration examples.

## 🔐 Authentication

NutriFlow uses Supabase Auth for user authentication. All API endpoints require authentication unless otherwise specified.

### Authentication Headers
```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Getting an Access Token
```javascript
// Client-side authentication
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Use data.session.access_token for API calls
```

## 🌐 Base URL
```
Production: https://nutriflow.app/api
Development: http://localhost:3000/api
```

## 📝 API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "nutritionist@example.com",
  "password": "SecurePassword123!",
  "fullName": "Dr. Jane Smith",
  "role": "nutritionist"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "nutritionist@example.com",
    "user_metadata": {
      "full_name": "Dr. Jane Smith",
      "role": "nutritionist"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### POST /api/auth/signin
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "nutritionist@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "session": { ... }
}
```

#### POST /api/auth/signout
Sign out the current user.

**Response:**
```json
{
  "success": true,
  "message": "Successfully signed out"
}
```

### Client Management Endpoints

#### GET /api/clients
Retrieve all clients for the authenticated nutritionist.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `status` (optional): Filter by status (active, inactive)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "date_of_birth": "1990-01-01",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### POST /api/clients
Create a new client.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "dietary_restrictions": ["vegetarian"],
  "goals": "Weight loss and improved nutrition",
  "medical_conditions": ["diabetes"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    // ... other fields
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/clients/:id
Retrieve a specific client by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    // ... client details
    "meal_plans": [...],
    "appointments": [...],
    "progress_entries": [...]
  }
}
```

#### PUT /api/clients/:id
Update a client's information.

**Request Body:** (same structure as POST, all fields optional)

#### DELETE /api/clients/:id
Delete a client.

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

### Meal Plan Endpoints

#### GET /api/meal-plans
Retrieve meal plans for the authenticated nutritionist.

**Query Parameters:**
- `client_id` (optional): Filter by client
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "title": "Weekly Meal Plan",
      "description": "Custom meal plan for weight loss",
      "start_date": "2024-01-01",
      "end_date": "2024-01-07",
      "meals": [
        {
          "day": "monday",
          "breakfast": { ... },
          "lunch": { ... },
          "dinner": { ... },
          "snacks": [...]
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/meal-plans
Create a new meal plan.

**Request Body:**
```json
{
  "client_id": "uuid",
  "title": "Weekly Meal Plan",
  "description": "Custom meal plan for weight loss",
  "start_date": "2024-01-01",
  "end_date": "2024-01-07",
  "dietary_preferences": ["vegetarian"],
  "calorie_target": 1800,
  "use_ai_generation": true
}
```

#### POST /api/meal-plans/generate
Generate a meal plan using AI.

**Request Body:**
```json
{
  "client_id": "uuid",
  "preferences": {
    "dietary_restrictions": ["vegetarian"],
    "calorie_target": 1800,
    "meal_count": 3,
    "duration_days": 7,
    "goals": "weight loss"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "title": "AI Generated Meal Plan",
      "meals": [...],
      "nutrition_summary": {
        "total_calories": 1750,
        "protein": 120,
        "carbs": 180,
        "fat": 65
      }
    }
  }
}
```

### Recipe Endpoints

#### GET /api/recipes
Retrieve recipes.

**Query Parameters:**
- `search` (optional): Search by name or ingredients
- `category` (optional): Filter by category
- `dietary_restrictions` (optional): Filter by dietary restrictions

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Grilled Chicken Salad",
      "description": "Healthy protein-rich salad",
      "prep_time": 15,
      "cook_time": 20,
      "servings": 2,
      "ingredients": [
        {
          "name": "Chicken breast",
          "amount": 200,
          "unit": "g"
        }
      ],
      "instructions": [...],
      "nutrition": {
        "calories": 350,
        "protein": 45,
        "carbs": 10,
        "fat": 15
      },
      "categories": ["main-course"],
      "dietary_tags": ["gluten-free", "low-carb"]
    }
  ]
}
```

#### POST /api/recipes
Create a new recipe.

**Request Body:**
```json
{
  "name": "Grilled Chicken Salad",
  "description": "Healthy protein-rich salad",
  "prep_time": 15,
  "cook_time": 20,
  "servings": 2,
  "ingredients": [...],
  "instructions": [...],
  "categories": ["main-course"],
  "dietary_tags": ["gluten-free", "low-carb"]
}
```

### Appointment Endpoints

#### GET /api/appointments
Retrieve appointments.

**Query Parameters:**
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date
- `client_id` (optional): Filter by client
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "title": "Initial Consultation",
      "description": "First meeting with client",
      "start_time": "2024-01-01T10:00:00Z",
      "end_time": "2024-01-01T11:00:00Z",
      "status": "scheduled",
      "type": "consultation",
      "location": "Office",
      "client": {
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ]
}
```

#### POST /api/appointments
Create a new appointment.

**Request Body:**
```json
{
  "client_id": "uuid",
  "title": "Follow-up Consultation",
  "description": "Check progress and adjust plan",
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T11:00:00Z",
  "type": "follow-up",
  "location": "Office"
}
```

### Invoice Endpoints

#### GET /api/invoices
Retrieve invoices.

**Query Parameters:**
- `client_id` (optional): Filter by client
- `status` (optional): Filter by status
- `date_from` (optional): Filter from date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "invoice_number": "INV-001",
      "issue_date": "2024-01-01",
      "due_date": "2024-01-31",
      "status": "pending",
      "items": [
        {
          "description": "Nutrition Consultation",
          "quantity": 1,
          "rate": 100.00,
          "amount": 100.00
        }
      ],
      "subtotal": 100.00,
      "tax": 10.00,
      "total": 110.00,
      "client": {
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ]
}
```

#### POST /api/invoices
Create a new invoice.

**Request Body:**
```json
{
  "client_id": "uuid",
  "due_date": "2024-01-31",
  "items": [
    {
      "description": "Nutrition Consultation",
      "quantity": 1,
      "rate": 100.00
    }
  ],
  "tax_rate": 0.1,
  "notes": "Payment due within 30 days"
}
```

### Analytics Endpoints

#### GET /api/analytics/overview
Get dashboard overview statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_clients": 45,
    "active_meal_plans": 32,
    "upcoming_appointments": 8,
    "pending_invoices": 5,
    "monthly_revenue": 4500.00,
    "client_growth": 12.5
  }
}
```

#### GET /api/analytics/clients
Get client analytics data.

**Query Parameters:**
- `period` (optional): "7d", "30d", "90d", "1y"
- `metric` (optional): "growth", "retention", "activity"

**Response:**
```json
{
  "success": true,
  "data": {
    "new_clients": [
      { "date": "2024-01-01", "count": 3 },
      { "date": "2024-01-02", "count": 1 }
    ],
    "retention_rate": 85.5,
    "active_clients": 42
  }
}
```

### Nutrition Analysis Endpoints

#### POST /api/nutrition/analyze
Analyze nutrition content of food items.

**Request Body:**
```json
{
  "foods": [
    {
      "name": "banana",
      "quantity": 1,
      "unit": "medium"
    },
    {
      "name": "oatmeal",
      "quantity": 50,
      "unit": "g"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_nutrition": {
      "calories": 245,
      "protein": 6.2,
      "carbs": 52.1,
      "fat": 2.8,
      "fiber": 7.5,
      "sugar": 18.2
    },
    "foods": [
      {
        "name": "banana",
        "nutrition": { ... }
      }
    ]
  }
}
```

## 🔧 Webhooks

NutriFlow supports webhooks for real-time notifications of events.

### Webhook Events
- `client.created`
- `client.updated`
- `appointment.scheduled`
- `appointment.completed`
- `invoice.paid`
- `meal_plan.created`

### Webhook Payload
```json
{
  "event": "client.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": "uuid",
    "nutritionist_id": "uuid",
    // ... event-specific data
  }
}
```

### Setting up Webhooks
```javascript
// Configure webhook endpoint
const webhook = await fetch('/api/webhooks/configure', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://yourapp.com/webhook',
    events: ['client.created', 'appointment.scheduled'],
    secret: 'webhook_secret'
  })
})
```

## 📊 Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General API endpoints**: 100 requests per 15 minutes per user
- **File upload endpoints**: 10 requests per hour per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## 🛠️ SDKs and Examples

### JavaScript/TypeScript SDK

```typescript
import { NutriFlowAPI } from '@nutriflow/sdk'

const api = new NutriFlowAPI({
  baseURL: 'https://nutriflow.app/api',
  apiKey: 'your-api-key'
})

// Get clients
const clients = await api.clients.list()

// Create meal plan
const mealPlan = await api.mealPlans.create({
  client_id: 'uuid',
  title: 'Weekly Plan',
  // ... other fields
})
```

### Python SDK Example

```python
import requests

class NutriFlowAPI:
    def __init__(self, api_key, base_url="https://nutriflow.app/api"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def get_clients(self):
        response = self.session.get(f'{self.base_url}/clients')
        return response.json()
    
    def create_client(self, client_data):
        response = self.session.post(
            f'{self.base_url}/clients',
            json=client_data
        )
        return response.json()

# Usage
api = NutriFlowAPI('your-api-key')
clients = api.get_clients()
```

## ❌ Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR` (401): Invalid or missing authentication
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## 🧪 Testing the API

### Using cURL
```bash
# Get clients
curl -X GET "https://nutriflow.app/api/clients" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Create client
curl -X POST "https://nutriflow.app/api/clients" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'
```

### Postman Collection
A Postman collection is available for testing all API endpoints:
- Import the collection from `/docs/NutriFlow_API.postman_collection.json`
- Set up environment variables for API key and base URL
- Run the collection to test all endpoints

---

For more detailed information or support, please refer to our [developer documentation](https://docs.nutriflow.app) or contact our API support team.
