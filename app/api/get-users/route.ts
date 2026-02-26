import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Type-safe access after null check
    const { organization_id: userOrgId } = userProfile as { organization_id: string; role: string }

    // Get all profiles in the user's organization
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('organization_id', userOrgId)

    if (profilesError || !profiles) {
      return NextResponse.json(
        { error: profilesError?.message || 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    const profileList = profiles as any[]

    // Fetch emails only for these users (parallel), instead of listUsers() which loads everyone
    const emailByUserId = new Map<string, string>()
    await Promise.all(
      profileList.map(async (profile: { id: string }) => {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(profile.id)
        if (authUser?.email) emailByUserId.set(profile.id, authUser.email)
      })
    )

    const profilesWithEmails = profileList.map((profile: any) => ({
      ...profile,
      email: emailByUserId.get(profile.id) || '',
    }))

    return NextResponse.json({
      profiles: profilesWithEmails,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
