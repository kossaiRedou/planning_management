import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/signup/')

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return res
  }

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    if (req.nextUrl.pathname.startsWith('/settings/billing')) {
      return res
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
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
