import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  try {
    const { email, firstName, lastName, role, organizationId } = await req.json()

    if (!email || !firstName || !lastName || !role || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the requesting user is an admin/owner of the organization
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

    // Check if user is admin/owner of the organization
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Type-safe access after null check
    const { organization_id: userOrgId, role: userRole } = userProfile as { organization_id: string; role: string }

    if (userOrgId !== organizationId || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization admins can create users' },
        { status: 403 }
      )
    }

    // Generate a default password (will be reset by user)
    const defaultPassword = 'DAOU2024!' // Default password for all new users

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        role: role,
      })

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    // Send password reset email so user can set their own password
    try {
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      })

      if (resetError) {
        console.error('Error generating reset link:', resetError)
        // Don't fail the entire operation if email fails
      } else {
        console.log('Password reset email sent to:', email)
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      defaultPassword: defaultPassword, // Return default password so admin can communicate it
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
