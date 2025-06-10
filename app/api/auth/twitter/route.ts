import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// OAuth 1.0a コールバックURL
const CALLBACK_URL = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`
  : 'http://localhost:3000/api/auth/twitter/callback';

export async function GET(request: NextRequest) {
  try {
    // セッションに店舗IDを保存（必要な場合）
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const accountType = searchParams.get('type') || 'store';
    
    // OAuth 1.0a認証フローを開始
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
    });
    
    // リクエストトークンを取得
    const authLink = await client.generateAuthLink(CALLBACK_URL, {
      linkMode: 'authorize'
    });
    
    // セッション情報をクッキーに保存
    const response = NextResponse.redirect(authLink.url);
    
    // OAuth検証用データとアプリケーションデータを保存
    response.cookies.set('twitter_oauth_token', authLink.oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10分
    });
    
    response.cookies.set('twitter_oauth_token_secret', authLink.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10
    });
    
    if (storeId) {
      response.cookies.set('twitter_auth_store_id', storeId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10
      });
    }
    
    response.cookies.set('twitter_auth_account_type', accountType, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10
    });
    
    return response;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.redirect('/admin/twitter-accounts?error=auth_failed');
  }
}