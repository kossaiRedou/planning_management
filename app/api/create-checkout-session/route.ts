import { NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe/server'

export async function POST(req: Request) {
  try {
    const { plan, adminEmail, organizationData, adminData } = await req.json()

    if (!plan || !adminEmail || !organizationData || !adminData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: `Secu-Planning ${selectedPlan.name}`,
              description: `Abonnement ${selectedPlan.name} - ${selectedPlan.features.join(', ')}`,
            },
            recurring: {
              interval: selectedPlan.interval,
            },
            unit_amount: selectedPlan.price,
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          admin_email: adminEmail,
          plan: plan,
        },
      },
      metadata: {
        admin_email: adminEmail,
        plan: plan,
        organization_name: organizationData.name,
        organization_email: organizationData.email,
        organization_phone: organizationData.phone || '',
        organization_address: organizationData.address || '',
        admin_first_name: adminData.firstName,
        admin_last_name: adminData.lastName,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
