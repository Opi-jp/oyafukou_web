import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


// 保護されたルートのリスト
const protectedRoutes = [
  '/admin',
  '/api/stores',
  '/api/upload',
  '/api/line-managers'
]

// 認証をスキップするルート
const publicRoutes = [
  '/api/line-webhook',
  '/api/auth/login'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開ルートはスキップ
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 保護されたルートかチェック
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // APIルートの場合
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      )
    }

    // middleware内ではjwtライブラリが使えないため、APIルートで検証
    return NextResponse.next()
  }

  // ページルートの場合（/admin）
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // ログインページへリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // トークンの検証はAPIルート側で行う
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/stores/:path*',
    '/api/upload/:path*',
    '/api/line-managers/:path*'
  ]
}