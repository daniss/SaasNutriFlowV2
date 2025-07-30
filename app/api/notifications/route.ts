import { notificationService } from '@/lib/notification-service'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipient, data } = body

    if (!type || !recipient) {
      return NextResponse.json(
        { error: 'Type and recipient are required' },
        { status: 400 }
      )
    }

    let result = { email: false, sms: false }

    switch (type) {
      case 'appointment_reminder':
        if (!data.appointmentDate || !data.appointmentTime || !data.dietitianName) {
          return NextResponse.json(
            { error: 'Missing appointment data' },
            { status: 400 }
          )
        }
        
        result = await notificationService.sendAppointmentReminder(
          recipient.email,
          recipient.phone,
          {
            date: data.appointmentDate,
            time: data.appointmentTime,
            dietitianName: data.dietitianName
          }
        )
        break

      case 'invoice_notification':
        if (!data.invoiceNumber || !data.amount || !data.dueDate || !data.dietitianName) {
          return NextResponse.json(
            { error: 'Missing invoice data' },
            { status: 400 }
          )
        }
        
        result.email = await notificationService.sendInvoiceNotification(
          recipient.email,
          {
            invoiceNumber: data.invoiceNumber,
            amount: data.amount,
            dueDate: data.dueDate,
            dietitianName: data.dietitianName
          }
        )
        break

      case 'meal_plan_notification':
        if (!data.name || !data.dietitianName) {
          return NextResponse.json(
            { error: 'Missing meal plan data' },
            { status: 400 }
          )
        }
        
        result.email = await notificationService.sendMealPlanNotification(
          recipient.email,
          {
            name: data.name,
            dietitianName: data.dietitianName
          }
        )
        break

      case 'welcome_email':
        if (!data.clientName || !data.dietitianName) {
          return NextResponse.json(
            { error: 'Missing welcome email data' },
            { status: 400 }
          )
        }
        
        result.email = await notificationService.sendWelcomeEmail(
          recipient.email,
          data.clientName,
          data.dietitianName
        )
        break

      case 'custom_email':
        if (!data.subject || !data.content) {
          return NextResponse.json(
            { error: 'Subject and content are required for custom email' },
            { status: 400 }
          )
        }
        
        result.email = await notificationService.sendEmail(
          recipient.email,
          data.subject,
          data.content,
          data.html
        )
        break

      case 'custom_sms':
        if (!data.message) {
          return NextResponse.json(
            { error: 'Message is required for SMS' },
            { status: 400 }
          )
        }
        
        if (recipient.phone) {
          result.sms = await notificationService.sendSMS(recipient.phone, data.message)
        }
        break

      case 'payment_reminder':
        if (!data.invoiceNumber || !data.amount || !data.clientName) {
          return NextResponse.json(
            { error: 'Missing payment reminder data' },
            { status: 400 }
          )
        }
        
        const paymentSubject = `Rappel de paiement - Facture ${data.invoiceNumber}`
        const paymentMessage = `Bonjour ${data.clientName},

Nous vous rappelons gentiment que la facture ${data.invoiceNumber} d'un montant de ${data.amount}€ est en attente de règlement.

${data.dueDate ? `Date d'échéance : ${new Date(data.dueDate).toLocaleDateString('fr-FR')}` : ''}

${data.serviceDescription ? `Service : ${data.serviceDescription}` : ''}

Merci de procéder au règlement dans les plus brefs délais.

Cordialement,
Votre diététicien`

        result.email = await notificationService.sendEmail(
          recipient.email,
          paymentSubject,
          paymentMessage
        )
        
        if (recipient.phone) {
          const smsText = `Rappel: Facture ${data.invoiceNumber} (${data.amount}€) en attente de règlement. Merci de procéder au paiement.`
          result.sms = await notificationService.sendSMS(recipient.phone, smsText)
        }
        break

      case 'custom_notification':
        if (!data.title) {
          return NextResponse.json(
            { error: 'Title is required for custom notification' },
            { status: 400 }
          )
        }
        
        const customSubject = data.title
        const customMessage = data.message || data.title
        
        result.email = await notificationService.sendEmail(
          recipient.email,
          customSubject,
          customMessage
        )
        
        if (recipient.phone && data.message) {
          result.sms = await notificationService.sendSMS(recipient.phone, data.message)
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.email || result.sms,
      details: result
    })

  } catch (error) {
    // TODO: Log notification sending errors to monitoring service
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
