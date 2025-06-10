import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const post = await ScheduledPost.findById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }
    
    if (post.status !== 'failed') {
      return NextResponse.json(
        { error: '再試行できるのは失敗した投稿のみです' },
        { status: 400 }
      );
    }
    
    // ステータスをpendingに戻して即座に実行
    await ScheduledPost.findByIdAndUpdate(id, {
      status: 'pending',
      error: null,
      scheduledAt: new Date()
    });
    
    // 投稿処理を実行（実際の実装では別途実行）
    // processPost(id);
    
    return NextResponse.json({ message: '投稿を再試行しました' });
  } catch (error) {
    console.error('Error retrying post:', error);
    return NextResponse.json(
      { error: '投稿の再試行に失敗しました' },
      { status: 500 }
    );
  }
}