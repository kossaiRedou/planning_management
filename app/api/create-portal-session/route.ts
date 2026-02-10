import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/server'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  try {
    // Get session from cookies
    const cookieStore = cookies()
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get user from auth header or session
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      userId = user?.id || null
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (!organization?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      )
    }

    // Create Stripe portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
