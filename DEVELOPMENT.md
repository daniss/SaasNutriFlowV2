# 👩‍💻 NutriFlow Development Guide

This guide provides comprehensive information for developers working on NutriFlow, including setup, architecture, coding standards, and best practices.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Project Architecture](#project-architecture)
4. [Coding Standards](#coding-standards)
5. [Testing Strategy](#testing-strategy)
6. [Database Development](#database-development)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Performance Guidelines](#performance-guidelines)
10. [Security Guidelines](#security-guidelines)
11. [Deployment Process](#deployment-process)
12. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (preferred) or npm 9+
- **Git** 2.30+
- **VS Code** (recommended editor)

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-playwright.playwright",
    "ms-vscode.test-adapter-converter"
  ]
}
```

### Environment Setup
1. **Install dependencies:**
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Database setup:**
   ```bash
   # Run database migrations
   psql -h your-db-host -U postgres -d postgres -f scripts/enhanced-schema.sql
   ```

## 🏗️ Project Architecture

### Directory Structure
```
📁 app/                     # Next.js 13+ App Router
├── 📁 (auth)/             # Auth route group
├── 📁 api/                # API routes
├── 📁 dashboard/          # Protected dashboard pages
├── 📁 client-portal/      # Client self-service portal
└── 📄 layout.tsx          # Root layout

📁 components/              # Reusable UI components
├── 📁 ui/                 # Base UI components (shadcn/ui)
├── 📁 auth/               # Authentication components
└── 📄 *.tsx               # Feature components

📁 lib/                     # Utility libraries
├── 📄 supabase.ts         # Database client
├── 📄 config.ts           # Configuration management
├── 📄 logger.ts           # Logging system
├── 📄 security.ts         # Security utilities
├── 📄 performance.ts      # Performance monitoring
└── 📄 *.ts                # Other utilities

📁 hooks/                   # Custom React hooks
📁 public/                  # Static assets
📁 scripts/                 # Database scripts
📁 __tests__/              # Test files
```

### Technology Stack

#### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Zod** - Schema validation

#### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Database-level security

#### External Services
- **Google Gemini AI** - Meal plan generation
- **Stripe** - Payment processing
- **Resend/SendGrid** - Email notifications
- **Twilio** - SMS notifications

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string
  email: string
  profile: UserProfile
}

// Use types for unions and complex types
type UserRole = 'nutritionist' | 'client' | 'admin'
type APIResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Use generics for reusable types
interface Repository<T> {
  findById(id: string): Promise<T | null>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}
```

#### Error Handling
```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Async error handling
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id)
    if (!user) {
      return { success: false, error: new Error('User not found') }
    }
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

### React Component Guidelines

#### Component Structure
```typescript
// Component props interface
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  className?: string
}

// Component implementation
export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onEdit, 
  className 
}) => {
  // Hooks first
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  
  // Event handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true)
    onEdit?.(user)
  }, [user, onEdit])
  
  // Early returns
  if (!user) {
    return <UserCardSkeleton />
  }
  
  // Render
  return (
    <Card className={cn('p-4', className)}>
      {/* Component content */}
    </Card>
  )
}
```

#### Custom Hooks
```typescript
// Custom hook for API calls
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const result = await userApi.getById(userId)
        if (result.success) {
          setUser(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [userId])
  
  return { user, loading, error, refetch: fetchUser }
}
```

### API Route Guidelines

#### Route Structure
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger, LogCategory } from '@/lib/logger'

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['nutritionist', 'client'])
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    
    const users = await userService.findMany({ page, limit })
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: { page, limit, total: users.length }
    })
  } catch (error) {
    logger.error(LogCategory.API, 'Failed to fetch users', error as Error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    
    const user = await userService.create(validatedData)
    
    logger.info(LogCategory.API, 'User created', { userId: user.id })
    
    return NextResponse.json({
      success: true,
      data: user
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error(LogCategory.API, 'Failed to create user', error as Error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Guidelines

#### Query Patterns
```typescript
// Use type-safe database queries
const getClientWithMealPlans = async (clientId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      meal_plans (
        id,
        title,
        start_date,
        end_date,
        status
      )
    `)
    .eq('id', clientId)
    .single()
  
  if (error) throw error
  return data
}

// Use RLS policies instead of manual filtering
const getUserClients = async (userId: string) => {
  // RLS policy ensures user only sees their own clients
  const { data, error } = await supabase
    .from('clients')
    .select('*')
  
  if (error) throw error
  return data
}
```

## 🧪 Testing Strategy

### Test Structure
```
📁 __tests__/
├── 📁 components/         # Component tests
├── 📁 api/               # API route tests
├── 📁 lib/               # Utility function tests
└── 📁 integration/       # Integration tests
```

### Component Testing
```typescript
// __tests__/components/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { UserCard } from '@/components/UserCard'

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User'
}

describe('UserCard', () => {
  it('displays user information', () => {
    render(<UserCard user={mockUser} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

### API Testing
```typescript
// __tests__/api/users.test.ts
import { GET, POST } from '@/app/api/users/route'
import { NextRequest } from 'next/server'

describe('/api/users', () => {
  it('returns users list', async () => {
    const request = new NextRequest('http://localhost:3000/api/users')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🗄️ Database Development

### Schema Management
```sql
-- Always use migrations for schema changes
-- scripts/migrations/001_add_user_preferences.sql

ALTER TABLE profiles 
ADD COLUMN dietary_preferences JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_profiles_dietary_preferences 
ON profiles USING gin(dietary_preferences);
```

### RLS Policies
```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data" ON clients
  FOR ALL USING (nutritionist_id = auth.uid());

-- Policy for reading public data
CREATE POLICY "Anyone can read public recipes" ON recipes
  FOR SELECT USING (is_public = true);
```

### Performance Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_clients_nutritionist_id ON clients(nutritionist_id);
CREATE INDEX idx_meal_plans_client_id ON meal_plans(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);

-- Use partial indexes for conditional queries
CREATE INDEX idx_active_clients ON clients(nutritionist_id) 
WHERE status = 'active';
```

## 🎨 Frontend Development

### State Management
```typescript
// Use React Context for global state
interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Custom hook for accessing state
export const useAppState = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}
```

### Form Handling
```typescript
// Use React Hook Form with Zod validation
const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type FormData = z.infer<typeof formSchema>

export const LoginForm = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })
  
  const onSubmit = async (data: FormData) => {
    try {
      await authService.signIn(data)
      router.push('/dashboard')
    } catch (error) {
      toast.error('Login failed')
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Styling Guidelines
```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <Button variant="outline" size="sm">Action</Button>
</div>

// Use CSS variables for theming
:root {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

// Use cn utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  'base-styles',
  isActive && 'active-styles',
  className
)} />
```

## ⚡ Performance Guidelines

### React Performance
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <ComplexVisualization data={data} />
})

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item))
}, [data])

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id)
}, [onItemClick])
```

### Code Splitting
```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))

// Use dynamic imports for conditional features
const loadPaymentProcessor = async () => {
  if (config.features.payments) {
    const { PaymentProcessor } = await import('./PaymentProcessor')
    return PaymentProcessor
  }
  return null
}
```

### Bundle Optimization
```javascript
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    }
    return config
  }
}
```

## 🔒 Security Guidelines

### Input Validation
```typescript
// Always validate input on both client and server
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['nutritionist', 'client'])
})

// Sanitize HTML content
import DOMPurify from 'dompurify'

const sanitizeHTML = (html: string) => {
  return DOMPurify.sanitize(html)
}
```

### Authentication
```typescript
// Check authentication on API routes
import { validateAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await validateAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Continue with authenticated request
}

// Use RLS policies for data access control
const { data, error } = await supabase
  .from('clients')
  .select('*')
  // RLS policy automatically filters by authenticated user
```

### Environment Variables
```typescript
// Never expose secrets to client-side
// Use NEXT_PUBLIC_ prefix only for client-safe variables
const config = {
  database: {
    url: process.env.SUPABASE_URL, // Server-side only
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Client-safe
  }
}
```

## 🚀 Deployment Process

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Environment variables are set
- [ ] Database migrations are applied
- [ ] Security headers are configured
- [ ] Performance budget is met

### Deployment Commands
```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run database migrations
psql -h $DATABASE_URL -f scripts/migrations/latest.sql

# Health check
curl https://yourdomain.com/api/health
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1"
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript Errors
```bash
# Check TypeScript compilation
pnpm type-check

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### Debugging

#### Enable Debug Logging
```typescript
// Set LOG_LEVEL=debug in .env.local
logger.debug(LogCategory.DATABASE, 'Query executed', { 
  query, 
  duration, 
  rowCount 
})
```

#### Performance Debugging
```typescript
// Use performance monitoring
import { trackAPICall } from '@/lib/performance'

const result = await trackAPICall(
  () => fetch('/api/data'),
  '/api/data',
  'GET'
)
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/docs)
- [Zod Documentation](https://zod.dev)

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Write tests for new functionality
4. Update documentation as needed
5. Create a pull request with a clear description
6. Ensure all checks pass before requesting review

---

For questions or support, please check the [GitHub Issues](https://github.com/your-org/nutriflow/issues) or contact the development team.
