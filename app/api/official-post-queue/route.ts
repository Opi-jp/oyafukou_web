import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OfficialPostQueue from '@/models/OfficialPostQueue';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const tags = searchParams.get('tags')?.split(',') || [];
    
    const query = tags.length > 0 ? { tags: { $in: tags } } : {};
    
    const posts = await OfficialPostQueue.find(query)
      .sort({ lastUsed: 1, createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching official posts:', error);
    return NextResponse.json(
      { error: '投稿テンプレートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const post = await OfficialPostQueue.create({
      name: body.name,
      textList: body.textList,
      mediaType: body.mediaType || 'none',
      mediaPath: body.mediaPath,
      tags: body.tags || [],
      createdBy: body.createdBy || 'admin'
    });
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating official post:', error);
    return NextResponse.json(
      { error: '投稿テンプレートの作成に失敗しました' },
      { status: 500 }
    );
  }
}