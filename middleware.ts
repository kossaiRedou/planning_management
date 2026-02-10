import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // API routes and webhooks should pass through
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return res
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated, check user profile and subscription status
  if (session) {
    // Allow access to billing page even if subscription is inactive
    if (req.nextUrl.pathname.startsWith('/settings/billing')) {
      return res
    }

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // Fetch organization to check subscription status
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status')
          .eq('id', profile.organization_id)
          .single()

        // If subscription is not active or trialing, redirect to billing
        if (org && !['active', 'trialing'].includes(org.subscription_status)) {
          if (!req.nextUrl.pathname.startsWith('/settings')) {
            return NextResponse.redirect(new URL('/settings/billing', req.url))
          }
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
    }

    // If authenticated and trying to access login/signup, redirect to home
    if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
