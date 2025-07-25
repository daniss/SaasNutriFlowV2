/**
 * Tests for payment service functionality
 * Critical for subscription management and revenue
 */

import { PaymentService, validateCurrency } from '@/lib/payment-service'

// Mock environment variables
const originalEnv = process.env
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'

// Mock fetch for Stripe API calls
global.fetch = jest.fn()

describe('payment-service', () => {
  let paymentService: PaymentService
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure environment variables are set for each test
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
    delete process.env.PAYPAL_CLIENT_ID
    delete process.env.PAYPAL_CLIENT_SECRET
    paymentService = new PaymentService()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('validateCurrency', () => {
    it('validates supported currencies', () => {
      const supportedCurrencies = ['EUR', 'USD', 'GBP', 'CAD']
      
      supportedCurrencies.forEach(currency => {
        expect(validateCurrency(currency)).toBe(true)
        expect(validateCurrency(currency.toLowerCase())).toBe(true)
      })
    })

    it('rejects unsupported currencies', () => {
      const unsupportedCurrencies = ['JPY', 'AUD', 'CHF', 'SEK']
      
      unsupportedCurrencies.forEach(currency => {
        expect(validateCurrency(currency)).toBe(false)
      })
    })
  })

  describe('createPaymentForInvoice', () => {
    it('creates payment intent for valid invoice', async () => {
      const mockResponse = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/test',
        amount: 5000,
        currency: 'eur',
        status: 'requires_payment_method'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await paymentService.createPaymentForInvoice('invoice-123', 50, 'eur')

      expect(result).toMatchObject({
        id: 'cs_test_123',
        amount: 50,
        currency: 'eur',
        paymentUrl: 'https://checkout.stripe.com/c/pay/test'
      })
    })

    it('handles Stripe API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Invalid API key' }
        })
      })

      await expect(
        paymentService.createPaymentForInvoice('invoice-123', 50, 'eur')
      ).rejects.toThrow('Invalid API key')
    })

    it('throws error when no provider is configured', async () => {
      // Create service without environment variables
      process.env.STRIPE_SECRET_KEY = ''
      process.env.STRIPE_PUBLIC_KEY = ''
      
      const serviceWithoutProvider = new PaymentService()
      
      await expect(
        serviceWithoutProvider.createPaymentForInvoice('invoice-123', 50, 'eur')
      ).rejects.toThrow('No payment provider configured')
    })
  })

  describe('createCustomer', () => {
    it('creates customer with valid data', async () => {
      const mockCustomer = {
        id: 'cus_test_123',
        email: 'test@example.com',
        name: 'Test Customer'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCustomer)
      })

      const result = await paymentService.createCustomer('test@example.com', 'Test Customer')

      expect(result).toEqual(mockCustomer)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/customers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk_test_mock_key'
          })
        })
      )
    })

    it('handles customer creation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Email already exists' }
        })
      })

      await expect(
        paymentService.createCustomer('existing@example.com', 'Test Customer')
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('createSubscription', () => {
    it('creates subscription with trial period', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'trialing',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
        items: {
          data: [{ price: { id: 'price_test_123' } }]
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubscription)
      })

      const result = await paymentService.createSubscription('cus_test_123', 'price_test_123')

      expect(result).toMatchObject({
        id: 'sub_test_123',
        customerId: 'cus_test_123',
        status: 'trialing',
        priceId: 'price_test_123'
      })
      expect(result.trialEnd).toBeInstanceOf(Date)
    })
  })

  describe('createCheckoutSession', () => {
    it('creates checkout session for subscription', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/test',
        customer: 'cus_test_123'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession)
      })

      const result = await paymentService.createCheckoutSession('cus_test_123', 'price_test_123')

      expect(result).toEqual({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/test',
        customerId: 'cus_test_123',
        metadata: undefined
      })
    })

    it('includes metadata in checkout session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/test',
        customer: 'cus_test_123',
        metadata: { source: 'upgrade_flow' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession)
      })

      const metadata = { source: 'upgrade_flow' }
      const result = await paymentService.createCheckoutSession('cus_test_123', 'price_test_123', metadata)

      expect(result.metadata).toEqual(metadata)
    })
  })

  describe('createBillingPortalSession', () => {
    it('creates billing portal session', async () => {
      const mockSession = {
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/session/test',
        customer: 'cus_test_123'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession)
      })

      const result = await paymentService.createBillingPortalSession('cus_test_123')

      expect(result).toEqual({
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/session/test',
        customerId: 'cus_test_123'
      })
    })

    it('includes return URL in billing portal session', async () => {
      const returnUrl = 'https://app.example.com/settings'
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'bps_test_123',
          url: 'https://billing.stripe.com/session/test',
          customer: 'cus_test_123'
        })
      })

      await paymentService.createBillingPortalSession('cus_test_123', returnUrl)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/billing_portal/sessions',
        expect.objectContaining({
          body: expect.stringContaining(encodeURIComponent(returnUrl))
        })
      )
    })
  })

  describe('getSubscription', () => {
    it('retrieves existing subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [{ price: { id: 'price_test_123' } }]
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubscription)
      })

      const result = await paymentService.getSubscription('sub_test_123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('sub_test_123')
      expect(result?.status).toBe('active')
    })

    it('returns null for non-existent subscription', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false
      })

      const result = await paymentService.getSubscription('sub_nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('cancelSubscription', () => {
    it('cancels active subscription', async () => {
      const mockCancelledSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'canceled',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [{ price: { id: 'price_test_123' } }]
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCancelledSubscription)
      })

      const result = await paymentService.cancelSubscription('sub_test_123')

      expect(result.status).toBe('canceled')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/subscriptions/sub_test_123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('webhook handling', () => {
    it('handles Stripe webhook events', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: { invoice_id: 'inv_123' }
          }
        }
      }

      const payload = JSON.stringify(mockEvent)
      const signature = 'test-signature'

      const result = await paymentService.handleWebhook(payload, signature)

      expect(result.success).toBe(true)
      expect(result.event).toEqual(mockEvent)
    })

    it('handles PayPal webhook events', async () => {
      // Mock PayPal provider
      process.env.PAYPAL_CLIENT_ID = 'test-client-id'
      process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret'
      delete process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_PUBLIC_KEY
      
      const paypalService = new PaymentService()
      
      const mockEvent = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'PAYPAL123' }
      }

      const payload = JSON.stringify(mockEvent)
      const signature = 'test-signature'

      const result = await paypalService.handleWebhook(payload, signature)

      expect(result.success).toBe(true)
      expect(result.event).toEqual(mockEvent)
    })

    it('handles malformed webhook payloads', async () => {
      const invalidPayload = 'not-json'
      const signature = 'test-signature'

      const result = await paymentService.handleWebhook(invalidPayload, signature)

      expect(result.success).toBe(false)
    })
  })

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(
        paymentService.createCustomer('test@example.com', 'Test Customer')
      ).rejects.toThrow('Network error')
    })

    it('handles rate limiting', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: { message: 'Too many requests' }
        })
      })

      await expect(
        paymentService.createCustomer('test@example.com', 'Test Customer')
      ).rejects.toThrow('Too many requests')
    })
  })
})