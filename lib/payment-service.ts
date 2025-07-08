// Payment Processing Integration for NutriFlow
// Supports multiple payment providers: Stripe, PayPal, and local French solutions

export interface PaymentProvider {
  id: string
  name: string
  type: 'stripe' | 'paypal' | 'sumup' | 'lydia_pro' | 'bank_transfer'
  enabled: boolean
  config: any
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_transfer' | 'digital_wallet' | 'check'
  last4?: string
  brand?: string
  expiry?: string
  is_default: boolean
  client_id: string
}

export interface PaymentPlan {
  id: string
  name: string
  description: string
  amount: number
  currency: 'EUR' | 'USD'
  billing_period: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  trial_days?: number
  features: string[]
  is_active: boolean
}

export interface PaymentLink {
  id: string
  invoice_id: string
  url: string
  amount: number
  currency: string
  expires_at: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payment_methods: string[]
}

export interface Transaction {
  id: string
  invoice_id: string
  client_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  payment_method: string
  provider: string
  provider_transaction_id?: string
  created_at: string
  processed_at?: string
  failure_reason?: string
  refund_amount?: number
  refund_reason?: string
}

export interface RecurringPayment {
  id: string
  client_id: string
  plan_id: string
  status: 'active' | 'paused' | 'cancelled' | 'past_due'
  next_payment_date: string
  last_payment_date?: string
  payment_method_id: string
  trial_end?: string
  created_at: string
}

export class PaymentService {
  private providers: Map<string, PaymentProvider>
  private webhook_secret: string

  constructor() {
    this.providers = new Map()
    this.webhook_secret = process.env.PAYMENT_WEBHOOK_SECRET || ''
    this.initializeProviders()
  }

  private initializeProviders() {
    // Stripe (International)
    this.providers.set('stripe', {
      id: 'stripe',
      name: 'Stripe',
      type: 'stripe',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      config: {
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        secret_key: process.env.STRIPE_SECRET_KEY,
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET
      }
    })

    // PayPal
    this.providers.set('paypal', {
      id: 'paypal',
      name: 'PayPal',
      type: 'paypal',
      enabled: !!process.env.PAYPAL_CLIENT_ID,
      config: {
        client_id: process.env.PAYPAL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox'
      }
    })

    // SumUp (Popular in France)
    this.providers.set('sumup', {
      id: 'sumup',
      name: 'SumUp',
      type: 'sumup',
      enabled: !!process.env.SUMUP_API_KEY,
      config: {
        api_key: process.env.SUMUP_API_KEY,
        merchant_code: process.env.SUMUP_MERCHANT_CODE
      }
    })

    // Lydia Pro (French digital wallet)
    this.providers.set('lydia_pro', {
      id: 'lydia_pro',
      name: 'Lydia Pro',
      type: 'lydia_pro',
      enabled: !!process.env.LYDIA_PRO_API_KEY,
      config: {
        api_key: process.env.LYDIA_PRO_API_KEY,
        vendor_token: process.env.LYDIA_PRO_VENDOR_TOKEN
      }
    })
  }

  // Create a payment link for an invoice
  async createPaymentLink(
    invoice_id: string,
    amount: number,
    currency: string = 'EUR',
    options: {
      description?: string
      expires_in_hours?: number
      payment_methods?: string[]
      success_url?: string
      cancel_url?: string
      metadata?: any
    } = {}
  ): Promise<PaymentLink> {
    try {
      const provider = this.getPreferredProvider()
      
      if (!provider) {
        throw new Error('No payment provider configured')
      }

      // For demo purposes, create a mock payment link
      const paymentLink: PaymentLink = {
        id: `link_${Date.now()}`,
        invoice_id,
        url: `https://pay.nutriflow.com/${invoice_id}?token=mock_token`,
        amount,
        currency,
        expires_at: new Date(Date.now() + (options.expires_in_hours || 24) * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        payment_methods: options.payment_methods || ['card', 'bank_transfer']
      }

      // In production, this would create actual payment links with the chosen provider
      console.log('Payment link created:', paymentLink)
      
      return paymentLink
    } catch (error) {
      console.error('Error creating payment link:', error)
      throw new Error('Failed to create payment link')
    }
  }

  // Process a one-time payment
  async processPayment(
    amount: number,
    currency: string,
    payment_method_id: string,
    client_id: string,
    invoice_id: string,
    metadata?: any
  ): Promise<Transaction> {
    try {
      const provider = this.getPreferredProvider()
      
      if (!provider) {
        throw new Error('No payment provider configured')
      }

      // Create transaction record
      const transaction: Transaction = {
        id: `txn_${Date.now()}`,
        invoice_id,
        client_id,
        amount,
        currency,
        status: 'processing',
        payment_method: payment_method_id,
        provider: provider.id,
        created_at: new Date().toISOString()
      }

      // Simulate payment processing
      if (provider.type === 'stripe') {
        await this.processStripePayment(transaction, metadata)
      } else if (provider.type === 'paypal') {
        await this.processPayPalPayment(transaction, metadata)
      } else if (provider.type === 'sumup') {
        await this.processSumUpPayment(transaction, metadata)
      }

      return transaction
    } catch (error) {
      console.error('Error processing payment:', error)
      throw new Error('Payment processing failed')
    }
  }

  // Set up recurring payments
  async createRecurringPayment(
    client_id: string,
    plan_id: string,
    payment_method_id: string,
    trial_days?: number
  ): Promise<RecurringPayment> {
    try {
      const provider = this.getPreferredProvider()
      
      if (!provider) {
        throw new Error('No payment provider configured')
      }

      const recurringPayment: RecurringPayment = {
        id: `sub_${Date.now()}`,
        client_id,
        plan_id,
        status: trial_days ? 'active' : 'active',
        next_payment_date: trial_days 
          ? new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method_id,
        trial_end: trial_days ? new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000).toISOString() : undefined,
        created_at: new Date().toISOString()
      }

      // In production, create subscription with payment provider
      console.log('Recurring payment created:', recurringPayment)
      
      return recurringPayment
    } catch (error) {
      console.error('Error creating recurring payment:', error)
      throw new Error('Failed to create recurring payment')
    }
  }

  // Refund a payment
  async refundPayment(
    transaction_id: string,
    amount?: number,
    reason?: string
  ): Promise<Transaction> {
    try {
      // In production, process refund with payment provider
      console.log('Processing refund:', { transaction_id, amount, reason })
      
      // Mock updated transaction
      const refundedTransaction: Transaction = {
        id: transaction_id,
        invoice_id: 'mock_invoice',
        client_id: 'mock_client',
        amount: amount || 0,
        currency: 'EUR',
        status: 'refunded',
        payment_method: 'card',
        provider: 'stripe',
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        refund_amount: amount,
        refund_reason: reason
      }

      return refundedTransaction
    } catch (error) {
      console.error('Error processing refund:', error)
      throw new Error('Refund processing failed')
    }
  }

  // Get payment methods for a client
  async getClientPaymentMethods(client_id: string): Promise<PaymentMethod[]> {
    try {
      // In production, fetch from payment provider and database
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1234',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiry: '12/25',
          is_default: true,
          client_id
        },
        {
          id: 'pm_5678',
          type: 'bank_transfer',
          is_default: false,
          client_id
        }
      ]

      return mockPaymentMethods
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      return []
    }
  }

  // Handle webhook from payment provider
  async handleWebhook(
    provider: string,
    payload: any,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(provider, payload, signature)) {
        throw new Error('Invalid webhook signature')
      }

      // Process webhook event
      switch (payload.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(payload.data.object)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(payload.data.object)
          break
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(payload.data.object)
          break
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(payload.data.object)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(payload.data.object)
          break
        default:
          console.log('Unhandled webhook event:', payload.type)
      }

      return { success: true, message: 'Webhook processed successfully' }
    } catch (error) {
      console.error('Error handling webhook:', error)
      return { success: false, message: 'Webhook processing failed' }
    }
  }

  // Get available payment plans
  getAvailablePaymentPlans(): PaymentPlan[] {
    return [
      {
        id: 'consultation_basic',
        name: 'Consultation Basique',
        description: 'Consultation nutritionnelle de base (60 min)',
        amount: 8000, // 80.00 EUR in cents
        currency: 'EUR',
        billing_period: 'one_time',
        features: [
          'Consultation de 60 minutes',
          'Plan alimentaire personnalisé',
          'Suivi par email pendant 1 semaine'
        ],
        is_active: true
      },
      {
        id: 'consultation_premium',
        name: 'Consultation Premium',
        description: 'Consultation approfondie avec suivi (90 min)',
        amount: 12000, // 120.00 EUR in cents
        currency: 'EUR',
        billing_period: 'one_time',
        features: [
          'Consultation de 90 minutes',
          'Plan alimentaire détaillé',
          'Recettes personnalisées',
          'Suivi pendant 1 mois',
          'Ajustements inclus'
        ],
        is_active: true
      },
      {
        id: 'suivi_mensuel',
        name: 'Suivi Mensuel',
        description: 'Accompagnement nutritionnel mensuel',
        amount: 6000, // 60.00 EUR in cents
        currency: 'EUR',
        billing_period: 'monthly',
        features: [
          '1 consultation mensuelle (45 min)',
          'Ajustements du plan alimentaire',
          'Support par email',
          'Accès aux ressources exclusives'
        ],
        is_active: true
      },
      {
        id: 'programme_3mois',
        name: 'Programme 3 Mois',
        description: 'Transformation nutritionnelle complète',
        amount: 29900, // 299.00 EUR in cents
        currency: 'EUR',
        billing_period: 'quarterly',
        trial_days: 7,
        features: [
          '6 consultations individuelles',
          'Plan alimentaire évolutif',
          'Recettes et menus hebdomadaires',
          'Suivi continu par application',
          'Groupe de soutien privé',
          'Garantie satisfaction'
        ],
        is_active: true
      }
    ]
  }

  // Private helper methods
  private getPreferredProvider(): PaymentProvider | null {
    // Return the first enabled provider, prioritizing Stripe
    const stripe = this.providers.get('stripe')
    if (stripe?.enabled) return stripe

    const sumup = this.providers.get('sumup')
    if (sumup?.enabled) return sumup

    const paypal = this.providers.get('paypal')
    if (paypal?.enabled) return paypal

    return null
  }

  private async processStripePayment(transaction: Transaction, metadata?: any): Promise<void> {
    // Simulate Stripe payment processing
    console.log('Processing Stripe payment:', transaction.id)
    
    // Mock success/failure
    const success = Math.random() > 0.1 // 90% success rate
    
    if (success) {
      transaction.status = 'succeeded'
      transaction.processed_at = new Date().toISOString()
      transaction.provider_transaction_id = `stripe_${Date.now()}`
    } else {
      transaction.status = 'failed'
      transaction.failure_reason = 'Card declined'
    }
  }

  private async processPayPalPayment(transaction: Transaction, metadata?: any): Promise<void> {
    // Simulate PayPal payment processing
    console.log('Processing PayPal payment:', transaction.id)
    
    const success = Math.random() > 0.05 // 95% success rate
    
    if (success) {
      transaction.status = 'succeeded'
      transaction.processed_at = new Date().toISOString()
      transaction.provider_transaction_id = `paypal_${Date.now()}`
    } else {
      transaction.status = 'failed'
      transaction.failure_reason = 'Insufficient funds'
    }
  }

  private async processSumUpPayment(transaction: Transaction, metadata?: any): Promise<void> {
    // Simulate SumUp payment processing
    console.log('Processing SumUp payment:', transaction.id)
    
    const success = Math.random() > 0.08 // 92% success rate
    
    if (success) {
      transaction.status = 'succeeded'
      transaction.processed_at = new Date().toISOString()
      transaction.provider_transaction_id = `sumup_${Date.now()}`
    } else {
      transaction.status = 'failed'
      transaction.failure_reason = 'Transaction declined'
    }
  }

  private verifyWebhookSignature(provider: string, payload: any, signature: string): boolean {
    // In production, verify webhook signature using provider's method
    console.log('Verifying webhook signature for:', provider)
    return true // Mock verification
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    console.log('Payment succeeded:', paymentIntent.id)
    // Update invoice status, send confirmation email, etc.
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    console.log('Payment failed:', paymentIntent.id)
    // Notify client, update invoice status, etc.
  }

  private async handleInvoicePaymentSuccess(invoice: any): Promise<void> {
    console.log('Invoice payment succeeded:', invoice.id)
    // Update invoice status, trigger fulfillment, etc.
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    console.log('Subscription created:', subscription.id)
    // Set up recurring payment schedule, send welcome email, etc.
  }

  private async handleSubscriptionCancelled(subscription: any): Promise<void> {
    console.log('Subscription cancelled:', subscription.id)
    // Handle cancellation, send confirmation, etc.
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// Utility functions for formatting
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100) // Convert from cents
}

export const getPaymentMethodDisplay = (method: PaymentMethod): string => {
  switch (method.type) {
    case 'card':
      return `${method.brand} •••• ${method.last4}`
    case 'bank_transfer':
      return 'Virement bancaire'
    case 'digital_wallet':
      return 'Portefeuille numérique'
    case 'check':
      return 'Chèque'
    default:
      return 'Méthode de paiement'
  }
}

export const getTransactionStatusColor = (status: string): string => {
  switch (status) {
    case 'succeeded': return 'text-green-600'
    case 'failed': return 'text-red-600'
    case 'refunded': return 'text-orange-600'
    case 'processing': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

export const getTransactionStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'En attente'
    case 'processing': return 'En cours'
    case 'succeeded': return 'Réussi'
    case 'failed': return 'Échoué'
    case 'refunded': return 'Remboursé'
    default: return status
  }
}
