import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Handle auth state for reset password page
  if (req.nextUrl.pathname === '/auth/reset-password') {
    // Allow access to reset password page without requiring authentication
    // The page itself will handle session validation
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/reset-password',
    '/dashboard/:path*',
    '/profile/:path*',
    '/groups/:path*'
  ]
}