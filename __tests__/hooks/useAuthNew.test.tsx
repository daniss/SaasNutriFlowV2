/**
 * Tests for the new authentication hook
 * Critical for user session management and security
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuthNew'
import React from 'react'

// Mock the AuthProvider
const mockAuthContext = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  isAuthenticated: false,
}

jest.mock('@/components/auth/AuthProviderNew', () => ({
  useAuth: jest.fn(() => mockAuthContext),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock context to default state
    Object.assign(mockAuthContext, {
      user: null,
      session: null,
      profile: null,
      loading: true,
      error: null,
      isAuthenticated: false,
    })
  })

  it('initializes with loading state', () => {
    mockAuthContext.loading = true
    mockAuthContext.user = null

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('loads authenticated user on mount', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    const mockProfile = {
      id: 'dietitian-123',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
    }

    mockAuthContext.loading = false
    mockAuthContext.user = mockUser
    mockAuthContext.profile = mockProfile
    mockAuthContext.isAuthenticated = true

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles authentication errors gracefully', () => {
    const errorMessage = 'Authentication failed'

    mockAuthContext.loading = false
    mockAuthContext.user = null
    mockAuthContext.error = errorMessage

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBe(errorMessage)
  })

  it('signs in user with valid credentials', async () => {
    mockAuthContext.signIn.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })

    const { result } = renderHook(() => useAuth())

    let signInResult
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password123')
    })

    expect(signInResult.error).toBeNull()
    expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('handles sign in errors', async () => {
    const errorMessage = 'Invalid credentials'
    mockAuthContext.signIn.mockResolvedValue({ data: null, error: errorMessage })

    const { result } = renderHook(() => useAuth())

    let signInResult
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
    })

    expect(signInResult.error).toBe(errorMessage)
    expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
  })

  it('signs up new user', async () => {
    const mockUser = { id: 'user-123', email: 'newuser@example.com' }
    mockAuthContext.signUp.mockResolvedValue({ data: { user: mockUser }, error: null })

    const { result } = renderHook(() => useAuth())

    let signUpResult
    await act(async () => {
      signUpResult = await result.current.signUp(
        'newuser@example.com',
        'password123',
        'New',
        'User'
      )
    })

    expect(signUpResult.error).toBeNull()
    expect(mockAuthContext.signUp).toHaveBeenCalledWith(
      'newuser@example.com',
      'password123',
      'New',
      'User'
    )
  })

  it('signs out user', async () => {
    mockAuthContext.signOut.mockResolvedValue()

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockAuthContext.signOut).toHaveBeenCalled()
  })
})