/**
 * Payment service integration for multiple providers
 * Supports: Stripe, PayPal, SumUp, Lydia Pro
 */

export interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<PaymentIntent>
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>
  createCustomer(email: string, name: string): Promise<Customer>
  createSubscription(customerId: string, priceId: string): Promise<Subscription>
  createCheckoutSession(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<CheckoutSession>
  createBillingPortalSession(customerId: string, returnUrl?: string): Promise<BillingPortalSession>
  getSubscription(subscriptionId: string): Promise<Subscription | null>
  cancelSubscription(subscriptionId: string): Promise<Subscription>
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  clientSecret?: string
  paymentUrl?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  paymentIntentId: string
  status: string
  error?: string
}

export interface Customer {
  id: string
  email: string
  name: string
}

export interface Subscription {
  id: string
  customerId: string
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'incomplete_expired'
  currentPeriodEnd: Date
  currentPeriodStart: Date
  priceId: string
  trialEnd?: Date
}

export interface CheckoutSession {
  id: string
  url: string
  customerId: string
  metadata?: Record<string, string>
}

export interface BillingPortalSession {
  id: string
  url: string
  customerId: string
}

// Stripe Provider
class StripeProvider implements PaymentProvider {
  private secretKey: string
  private publicKey: string

  constructor(secretKey: string, publicKey: string) {
    this.secretKey = secretKey
    this.publicKey = publicKey
  }

  async createPaymentIntent(amount: number, currency: string = 'eur', metadata?: Record<string, string>): Promise<PaymentIntent> {
    // First try to create a Checkout Session for better UX
    try {
      const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'line_items[0][price_data][currency]': currency,
          'line_items[0][price_data][product_data][name]': 'Consultation diététique',
          'line_items[0][price_data][unit_amount]': (amount * 100).toString(),
          'line_items[0][quantity]': '1',
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/invoices?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/invoices?payment=cancelled`,
          ...(metadata?.invoice_id && { 'metadata[invoice_id]': metadata.invoice_id })
        })
      })

      const checkoutData = await checkoutResponse.json()
      
      if (checkoutResponse.ok && checkoutData.url) {
        return {
          id: checkoutData.id,
          amount: amount,
          currency: currency,
          status: 'requires_payment_method',
          paymentUrl: checkoutData.url,
          metadata: metadata
        }
      }
    } catch (error) {
      console.warn('Checkout session creation failed, falling back to Payment Intent:', error)
    }

    // Fallback to Payment Intent
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: (amount * 100).toString(), // Stripe uses cents
          currency,
          automatic_payment_methods: JSON.stringify({ enabled: true }),
          ...(metadata && { 'metadata[invoice_id]': metadata.invoice_id || '' })
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Payment intent creation failed')
      }

      return {
        id: data.id,
        amount: data.amount / 100, // Convert back to euros
        currency: data.currency,
        status: data.status,
        clientSecret: data.client_secret,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Stripe payment intent error:', error)
      throw error
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        }
      })

      const data = await response.json()
      
      return {
        success: data.status === 'succeeded',
        paymentIntentId: data.id,
        status: data.status,
        error: data.last_payment_error?.message
      }
    } catch (error) {
      console.error('Stripe payment confirmation error:', error)
      return {
        success: false,
        paymentIntentId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async createCustomer(email: string, name: string): Promise<Customer> {
    try {
      const response = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          name
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Customer creation failed')
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name
      }
    } catch (error) {
      console.error('Stripe customer creation error:', error)
      throw error
    }
  }

  async createSubscription(customerId: string, priceId: string): Promise<Subscription> {
    try {
      const response = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: customerId,
          'items[0][price]': priceId,
          trial_period_days: '14', // 14-day trial
          expand: JSON.stringify(['latest_invoice.payment_intent'])
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Subscription creation failed')
      }

      return {
        id: data.id,
        customerId: data.customer,
        status: data.status,
        currentPeriodEnd: new Date(data.current_period_end * 1000),
        currentPeriodStart: new Date(data.current_period_start * 1000),
        priceId: data.items.data[0].price.id,
        trialEnd: data.trial_end ? new Date(data.trial_end * 1000) : undefined
      }
    } catch (error) {
      console.error('Stripe subscription creation error:', error)
      throw error
    }
  }

  async createCheckoutSession(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<CheckoutSession> {
    try {
      const params = new URLSearchParams({
        customer: customerId,
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing`,
        'subscription_data[trial_period_days]': '14'
      })

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          params.append(`metadata[${key}]`, value)
        })
      }

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Checkout session creation failed')
      }

      return {
        id: data.id,
        url: data.url,
        customerId: data.customer,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Stripe checkout session creation error:', error)
      throw error
    }
  }

  async createBillingPortalSession(customerId: string, returnUrl?: string): Promise<BillingPortalSession> {
    try {
      const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: customerId,
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/settings`
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Billing portal session creation failed')
      }

      return {
        id: data.id,
        url: data.url,
        customerId: data.customer
      }
    } catch (error) {
      console.error('Stripe billing portal session creation error:', error)
      throw error
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        }
      })

      if (response.status === 404) {
        return null
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch subscription')
      }

      return {
        id: data.id,
        customerId: data.customer,
        status: data.status,
        currentPeriodEnd: new Date(data.current_period_end * 1000),
        currentPeriodStart: new Date(data.current_period_start * 1000),
        priceId: data.items.data[0].price.id,
        trialEnd: data.trial_end ? new Date(data.trial_end * 1000) : undefined
      }
    } catch (error) {
      console.error('Stripe get subscription error:', error)
      throw error
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Subscription cancellation failed')
      }

      return {
        id: data.id,
        customerId: data.customer,
        status: data.status,
        currentPeriodEnd: new Date(data.current_period_end * 1000),
        currentPeriodStart: new Date(data.current_period_start * 1000),
        priceId: data.items.data[0].price.id,
        trialEnd: data.trial_end ? new Date(data.trial_end * 1000) : undefined
      }
    } catch (error) {
      console.error('Stripe subscription cancellation error:', error)
      throw error
    }
  }
}

// PayPal Provider (simplified implementation)
class PayPalProvider implements PaymentProvider {
  private clientId: string
  private clientSecret: string
  private baseURL: string

  constructor(clientId: string, clientSecret: string, sandbox = false) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.baseURL = sandbox ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    return data.access_token
  }

  async createPaymentIntent(amount: number, currency: string = 'EUR', metadata?: Record<string, string>): Promise<PaymentIntent> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            }
          }]
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'PayPal order creation failed')
      }

      return {
        id: data.id,
        amount,
        currency,
        status: 'requires_payment_method',
        metadata
      }
    } catch (error) {
      console.error('PayPal payment intent error:', error)
      throw error
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseURL}/v2/checkout/orders/${paymentIntentId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      return {
        success: data.status === 'COMPLETED',
        paymentIntentId,
        status: data.status,
        error: data.details?.[0]?.description
      }
    } catch (error) {
      console.error('PayPal payment confirmation error:', error)
      return {
        success: false,
        paymentIntentId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async createCustomer(email: string, name: string): Promise<Customer> {
    // PayPal doesn't have a direct customer creation API like Stripe
    // This would typically be handled through their subscription APIs
    return {
      id: `paypal_${Date.now()}`,
      email,
      name
    }
  }

  async createSubscription(customerId: string, priceId: string): Promise<Subscription> {
    // Simplified implementation - would need proper PayPal subscription setup
    throw new Error('PayPal subscriptions not implemented in this example')
  }

  async createCheckoutSession(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<CheckoutSession> {
    throw new Error('PayPal checkout sessions not implemented in this example')
  }

  async createBillingPortalSession(customerId: string, returnUrl?: string): Promise<BillingPortalSession> {
    throw new Error('PayPal billing portal not implemented in this example')
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    throw new Error('PayPal get subscription not implemented in this example')
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    throw new Error('PayPal cancel subscription not implemented in this example')
  }
}

// Main Payment Service
export class PaymentService {
  private provider: PaymentProvider | null = null
  private providerName: string | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    // Initialize based on environment variables
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY) {
      this.provider = new StripeProvider(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_PUBLIC_KEY)
      this.providerName = 'stripe'
    } else if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      const sandbox = process.env.NODE_ENV !== 'production'
      this.provider = new PayPalProvider(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET, sandbox)
      this.providerName = 'paypal'
    }
  }

  getProviderName(): string | null {
    return this.providerName
  }

  async createPaymentForInvoice(invoiceId: string, amount: number, currency: string = 'eur'): Promise<PaymentIntent> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.createPaymentIntent(amount, currency, { invoice_id: invoiceId })
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.confirmPayment(paymentIntentId)
  }

  async createCustomer(email: string, name: string): Promise<Customer> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.createCustomer(email, name)
  }

  async createSubscription(customerId: string, priceId: string): Promise<Subscription> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.createSubscription(customerId, priceId)
  }

  async createCheckoutSession(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<CheckoutSession> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.createCheckoutSession(customerId, priceId, metadata)
  }

  async createBillingPortalSession(customerId: string, returnUrl?: string): Promise<BillingPortalSession> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.createBillingPortalSession(customerId, returnUrl)
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.getSubscription(subscriptionId)
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    if (!this.provider) {
      throw new Error('No payment provider configured')
    }

    return await this.provider.cancelSubscription(subscriptionId)
  }

  // Webhook handlers
  async handleWebhook(payload: string, signature: string): Promise<{ success: boolean; event?: any }> {
    try {
      if (this.providerName === 'stripe') {
        return this.handleStripeWebhook(payload, signature)
      } else if (this.providerName === 'paypal') {
        return this.handlePayPalWebhook(payload, signature)
      }
      
      return { success: false }
    } catch (error) {
      console.error('Webhook handling error:', error)
      return { success: false }
    }
  }

  private async handleStripeWebhook(payload: string, signature: string): Promise<{ success: boolean; event?: any }> {
    // In a real implementation, you would verify the webhook signature
    // and process the event accordingly
    try {
      const event = JSON.parse(payload)
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Update invoice status in database
          console.log('Payment succeeded:', event.data.object.id)
          break
        case 'payment_intent.payment_failed':
          // Handle failed payment
          console.log('Payment failed:', event.data.object.id)
          break
        default:
          console.log('Unhandled event type:', event.type)
      }
      
      return { success: true, event }
    } catch (error) {
      console.error('Stripe webhook error:', error)
      return { success: false }
    }
  }

  private async handlePayPalWebhook(payload: string, signature: string): Promise<{ success: boolean; event?: any }> {
    // PayPal webhook verification and handling
    try {
      const event = JSON.parse(payload)
      
      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          console.log('PayPal payment completed:', event.resource.id)
          break
        case 'PAYMENT.CAPTURE.DENIED':
          console.log('PayPal payment denied:', event.resource.id)
          break
        default:
          console.log('Unhandled PayPal event:', event.event_type)
      }
      
      return { success: true, event }
    } catch (error) {
      console.error('PayPal webhook error:', error)
      return { success: false }
    }
  }
}

// Singleton instance
export const paymentService = new PaymentService()

// Utility functions


export function validateCurrency(currency: string): boolean {
  const supportedCurrencies = ['EUR', 'USD', 'GBP', 'CAD']
  return supportedCurrencies.includes(currency.toUpperCase())
}
