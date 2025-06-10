import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PostLog from '@/models/PostLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const query = storeId ? { storeId } : {};
    
    const logs = await PostLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching post logs:', error);
    return NextResponse.json(
      { error: '投稿履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const log = await PostLog.create({
      textList: body.textList,
      mediaType: body.mediaType || 'none',
      mediaPath: body.mediaPath,
      sourceAccount: body.sourceAccount,
      storeId: body.storeId
    });
    
    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating post log:', error);
    return NextResponse.json(
      { error: '投稿履歴の作成に失敗しました' },
      { status: 500 }
    );
  }
}