import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh the session -- this validates the token and refreshes cookies
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/signup/')

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return res
  }

  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session) {
    if (req.nextUrl.pathname.startsWith('/settings/billing')) {
      return res
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status')
          .eq('id', profile.organization_id)
          .single()

        if (org && !['active', 'trialing'].includes(org.subscription_status)) {
          if (!req.nextUrl.pathname.startsWith('/settings')) {
            return NextResponse.redirect(new URL('/settings/billing', req.url))
          }
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
    }

    if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
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
