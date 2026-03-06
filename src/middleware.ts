import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('accessToken')?.value

  const isLoginPage = pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/'

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
