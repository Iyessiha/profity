import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Protéger uniquement les routes API admin
  // Les pages (dashboard, admin, settings) gèrent leur propre auth côté client
  if (path.startsWith('/api/admin')) {
    const token = req.headers.get('authorization')
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*'],
}
