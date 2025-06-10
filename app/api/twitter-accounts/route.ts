import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TwitterToken from '@/models/TwitterToken';
import Store from '@/models/Store';

export async function GET() {
  try {
    await connectDB();
    
    const accounts = await TwitterToken.find()
      .populate('storeId', 'name')
      .sort({ createdAt: -1 });
    
    const formattedAccounts = accounts.map(account => ({
      _id: account._id,
      twitterHandle: account.twitterHandle,
      displayName: account.displayName,
      storeId: account.storeId?._id,
      storeName: account.storeId?.name,
      isActive: account.isActive,
      accountType: account.accountType,
      lastUsed: account.lastUsed
    }));
    
    return NextResponse.json(formattedAccounts);
  } catch (error) {
    console.error('Error fetching Twitter accounts:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // 既存のハンドル名チェック
    const existing = await TwitterToken.findOne({ 
      twitterHandle: body.twitterHandle 
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'このハンドル名は既に登録されています' },
        { status: 400 }
      );
    }
    
    const account = await TwitterToken.create({
      twitterHandle: body.twitterHandle,
      displayName: body.displayName,
      accessToken: body.accessToken,
      accessTokenSecret: body.accessTokenSecret,
      accountType: body.accountType,
      storeId: body.storeId || undefined
    });
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating Twitter account:', error);
    return NextResponse.json(
      { error: 'アカウントの登録に失敗しました' },
      { status: 500 }
    );
  }
}