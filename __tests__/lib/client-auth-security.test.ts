/**
 * Tests for client authentication security functions
 * Critical for ensuring secure client session management
 */

import {
  createClientToken,
  validateClientSession,
  validateClientAuth,
} from '@/lib/client-auth-security'

// Mock Supabase for this test
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock environment variable
process.env.CLIENT_AUTH_SECRET = 'test-secret-key-for-hmac-256-bit-security'

describe('client-auth-security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createClientToken', () => {
    it('creates a valid token for client', () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      
      const token = createClientToken(clientId, email)
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(50) // Should be a substantial base64 string
    })

    it('creates different tokens for different clients', () => {
      const token1 = createClientToken('client-1', 'test1@example.com')
      const token2 = createClientToken('client-2', 'test2@example.com')
      
      expect(token1).not.toBe(token2)
    })

    it('creates different tokens at different times', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      
      const token1 = createClientToken(clientId, email)
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const token2 = createClientToken(clientId, email)
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('validateClientSession', () => {
    it('validates a valid token', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      
      // Mock successful database response
      mockSupabaseClient.from().single.mockResolvedValue({
        data: { client_id: clientId, is_active: true },
        error: null,
      })
      
      const token = createClientToken(clientId, email)
      const result = await validateClientSession(token)
      
      expect(result).toBe(clientId)
    })

    it('rejects invalid token format', async () => {
      const result = await validateClientSession('invalid-token')
      expect(result).toBeNull()
    })

    it('rejects expired token', async () => {
      // Create a token that's already expired by mocking Date.now
      const originalNow = Date.now
      Date.now = jest.fn(() => 1000000) // Past time
      
      const token = createClientToken('client-123', 'test@example.com')
      
      // Restore Date.now and simulate future time
      Date.now = jest.fn(() => 2000000 + 25 * 60 * 60 * 1000) // 25 hours later
      
      const result = await validateClientSession(token)
      expect(result).toBeNull()
      
      // Restore original Date.now
      Date.now = originalNow
    })

    it('rejects token for inactive client', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      
      // Mock database response with inactive client
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Client not found or inactive' },
      })
      
      const token = createClientToken(clientId, email)
      const result = await validateClientSession(token)
      
      expect(result).toBeNull()
    })

    it('handles database errors gracefully', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      
      // Mock database error
      mockSupabaseClient.from().single.mockRejectedValue(new Error('Database error'))
      
      const token = createClientToken(clientId, email)
      const result = await validateClientSession(token)
      
      expect(result).toBeNull()
    })
  })

  describe('validateClientAuth', () => {
    it('validates request with valid Bearer token', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      const token = createClientToken(clientId, email)
      
      // Mock successful validation
      mockSupabaseClient.from().single.mockResolvedValue({
        data: { client_id: clientId, is_active: true },
        error: null,
      })
      
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await validateClientAuth(request)
      
      expect(result).toHaveProperty('clientId', clientId)
    })

    it('rejects request without Authorization header', async () => {
      const request = new Request('http://localhost:3000/api/test')
      
      const result = await validateClientAuth(request)
      
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('status', 401)
    })

    it('rejects request with invalid Authorization format', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'InvalidFormat token123',
        },
      })
      
      const result = await validateClientAuth(request)
      
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('status', 401)
    })

    it('rejects request with invalid token', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })
      
      const result = await validateClientAuth(request)
      
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('status', 401)
    })

    it('rejects request for non-existent client', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      const token = createClientToken(clientId, email)
      
      // Mock database response with no client
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Client not found' },
      })
      
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await validateClientAuth(request)
      
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('status', 401)
    })
  })

  describe('token security properties', () => {
    it('tokens should not be predictable', () => {
      const tokens = new Set()
      
      // Generate 100 tokens and ensure they're all unique
      for (let i = 0; i < 100; i++) {
        const token = createClientToken(`client-${i}`, `test${i}@example.com`)
        expect(tokens.has(token)).toBe(false)
        tokens.add(token)
      }
      
      expect(tokens.size).toBe(100)
    })

    it('tokens should be tamper-resistant', async () => {
      const clientId = 'client-123'
      const email = 'test@example.com'
      const validToken = createClientToken(clientId, email)
      
      // Try to tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'AAAAA'
      
      const result = await validateClientSession(tamperedToken)
      expect(result).toBeNull()
    })

    it('should handle malformed base64 tokens', async () => {
      const malformedTokens = [
        'not-base64!',
        'SGVsbG8gV29ybGQ=', // Valid base64 but invalid JSON
        'eyJpbnZhbGlkIjoidG9rZW4ifQ==', // Valid JSON but missing signature
      ]
      
      for (const token of malformedTokens) {
        const result = await validateClientSession(token)
        expect(result).toBeNull()
      }
    })
  })
})