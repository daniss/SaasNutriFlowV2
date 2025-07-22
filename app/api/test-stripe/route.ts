import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

export async function GET() {
  try {
    // Test basic Stripe configuration
    const providerName = paymentService.getProviderName()
    
    if (!providerName) {
      return NextResponse.json({ 
        error: 'No payment provider configured',
        details: {
          stripe_secret_key_exists: !!process.env.STRIPE_SECRET_KEY,
          stripe_public_key_exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !!process.env.STRIPE_PUBLIC_KEY,
        }
      }, { status: 500 })
    }

    // Test creating a customer (simpler than checkout session)
    try {
      const testCustomer = await paymentService.createCustomer(
        'test@example.com',
        'Test User'
      )
      
      return NextResponse.json({
        success: true,
        provider: providerName,
        test_customer_created: true,
        customer_id: testCustomer.id
      })
    } catch (customerError) {
      return NextResponse.json({
        error: 'Stripe customer creation failed',
        provider: providerName,
        details: customerError instanceof Error ? customerError.message : String(customerError)
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}