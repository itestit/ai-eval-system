import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from './lib/auth'

// Public paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for API routes
  if (pathname.startsWith('/api/')) {
    // API routes handle auth themselves
    return NextResponse.next()
  }

  // Verify token for protected routes
  const token = request.cookies.get('token')?.value

  if (!token) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifyJWT(token)

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && !session.isAdmin) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
