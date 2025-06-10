import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import connectDB from '@/lib/mongodb';
import TwitterToken from '@/models/TwitterToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');
    
    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect('/admin/twitter-accounts?error=missing_params');
    }
    
    // クッキーから保存した情報を取得
    const savedToken = request.cookies.get('twitter_oauth_token')?.value;
    const savedTokenSecret = request.cookies.get('twitter_oauth_token_secret')?.value;
    const storeId = request.cookies.get('twitter_auth_store_id')?.value;
    const accountType = request.cookies.get('twitter_auth_account_type')?.value || 'store';
    
    if (!savedToken || !savedTokenSecret || savedToken !== oauth_token) {
      return NextResponse.redirect('/admin/twitter-accounts?error=token_mismatch');
    }
    
    // アクセストークンを取得
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: oauth_token,
      accessSecret: savedTokenSecret,
    });
    
    try {
      const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier);
      
      // ユーザー情報を取得
      const user = await loggedClient.v2.me();
      
      // データベースに保存
      await connectDB();
      
      // 既存のアカウントをチェック
      const existing = await TwitterToken.findOne({ 
        twitterHandle: user.data.username 
      });
      
      if (existing) {
        // 既存アカウントを更新
        await TwitterToken.findByIdAndUpdate(existing._id, {
          accessToken,
          accessTokenSecret: accessSecret,
          displayName: user.data.name,
          lastUsed: new Date()
        });
      } else {
        // 新規作成
        await TwitterToken.create({
          twitterHandle: user.data.username,
          displayName: user.data.name,
          accessToken,
          accessTokenSecret: accessSecret,
          accountType,
          storeId: storeId || undefined,
          isActive: true
        });
      }
      
      // クッキーをクリア
      const response = NextResponse.redirect('/admin/twitter-accounts?success=true');
      response.cookies.delete('twitter_oauth_token');
      response.cookies.delete('twitter_oauth_token_secret');
      response.cookies.delete('twitter_auth_store_id');
      response.cookies.delete('twitter_auth_account_type');
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return NextResponse.redirect('/admin/twitter-accounts?error=login_failed');
    }
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect('/admin/twitter-accounts?error=callback_failed');
  }
}