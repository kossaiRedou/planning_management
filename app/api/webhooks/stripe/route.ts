import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', session.id)

        // Extract metadata
        const adminEmail = session.customer_details?.email || session.metadata?.admin_email
        const plan = session.metadata?.plan
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!adminEmail || !plan) {
          console.error('Missing metadata in checkout session')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        let userId = existingUsers?.users.find(u => u.email === adminEmail)?.id

        // If user doesn't exist, create it
        if (!userId) {
          const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: session.metadata.admin_first_name,
              last_name: session.metadata.admin_last_name,
            },
          })

          if (authError) {
            console.error('Error creating auth user:', authError)
            throw authError
          }

          if (!authData.user) {
            throw new Error('Failed to create auth user')
          }

          userId = authData.user.id
          console.log('Auth user created:', userId)
        } else {
          console.log('Auth user already exists:', userId)
        }

        // Check if organization with this email already exists
        const { data: existingOrg } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('email', session.metadata.organization_email)
          .single()

        let organization

        if (existingOrg) {
          // Organization already exists, update it instead
          console.log('Organization already exists, updating:', existingOrg.id)
          const { data: updatedOrg, error: updateError } = await supabaseAdmin
            .from('organizations')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'trialing',
              subscription_plan: plan,
              trial_ends_at: trialEndsAt.toISOString(),
            })
            .eq('id', existingOrg.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating organization:', updateError)
            throw updateError
          }
          organization = updatedOrg
        } else {
          // Create new organization
          const { data: newOrg, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
              name: session.metadata.organization_name,
              email: session.metadata.organization_email,
              phone: session.metadata.organization_phone || null,
              address: session.metadata.organization_address || null,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'trialing',
              subscription_plan: plan,
              trial_ends_at: trialEndsAt.toISOString(),
            })
            .select()
            .single()

          if (orgError) {
            console.error('Error creating organization:', orgError)
            throw orgError
          }
          organization = newOrg
        }

        console.log('Organization created/updated:', organization.id)

        // Create user profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: userId,
            organization_id: organization.id,
            first_name: session.metadata.admin_first_name,
            last_name: session.metadata.admin_last_name,
            role: 'owner',
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          throw profileError
        }

        console.log('User profile created for:', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)

        // Update organization subscription status
        const { error } = await supabaseAdmin
          .from('organizations')
          .update({
            subscription_status: subscription.status,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription status:', error)
          throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)

        // Mark organization as canceled
        const { error } = await supabaseAdmin
          .from('organizations')
          .update({
            subscription_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error marking subscription as canceled:', error)
          throw error
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Payment succeeded for invoice:', invoice.id)

        if (invoice.subscription) {
          // Update subscription status to active
          const { error } = await supabaseAdmin
            .from('organizations')
            .update({
              subscription_status: 'active',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating to active status:', error)
            throw error
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Payment failed for invoice:', invoice.id)

        if (invoice.subscription) {
          // Update subscription status to past_due
          const { error } = await supabaseAdmin
            .from('organizations')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating to past_due status:', error)
            throw error
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
