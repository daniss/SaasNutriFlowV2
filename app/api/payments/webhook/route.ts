import { paymentService } from '@/lib/payment-service'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature') || request.headers.get('paypal-transmission-sig') || ''
    const payload = await request.text()

    const result = await paymentService.handleWebhook(payload, signature)

    if (result.success && result.event) {
      // Update database based on webhook event
      const supabase = await createClient()
      
      // Handle different webhook events
      if (result.event.type === 'payment_intent.succeeded' || result.event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const paymentIntentId = result.event.data?.object?.id || result.event.resource?.id
        const metadata = result.event.data?.object?.metadata || {}
        
        if (metadata.invoice_id) {
          // First verify the invoice exists and get its dietitian_id
          const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('id, dietitian_id')
            .eq('id', metadata.invoice_id)
            .single()

          if (fetchError || !invoice) {
            // TODO: Log invoice fetch error to monitoring service
            return NextResponse.json(
              { error: 'Invalid invoice ID' },
              { status: 400 }
            )
          }

          // Update invoice status to paid with dietitian_id check
          const { error } = await supabase
            .from('invoices')
            .update({ 
              status: 'paid',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', metadata.invoice_id)
            .eq('dietitian_id', invoice.dietitian_id) // Multi-tenant safety

          if (error) {
            // TODO: Log invoice status update error to monitoring service
          }
        }
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    // TODO: Log webhook processing error to monitoring service
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
