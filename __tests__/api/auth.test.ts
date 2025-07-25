import { GET, POST } from '@/app/api/auth/route'
import { NextRequest } from 'next/server'

// Mock createClient from server
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  },
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('/api/auth', () => {
  describe('GET', () => {
    it('returns user data when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      }

      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(mockUser)
    })

    it('returns 401 when not authenticated', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/auth')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('creates user account successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      }

      const { supabase } = require('@/lib/supabase')
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(mockUser)
    })

    it('returns error for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
