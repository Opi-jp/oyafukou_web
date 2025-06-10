import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';

export async function DELETE(
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
    
    if (post.status !== 'pending') {
      return NextResponse.json(
        { error: 'キャンセルできるのは予約中の投稿のみです' },
        { status: 400 }
      );
    }
    
    await ScheduledPost.findByIdAndDelete(id);
    
    return NextResponse.json({ message: '投稿をキャンセルしました' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: '投稿のキャンセルに失敗しました' },
      { status: 500 }
    );
  }
}