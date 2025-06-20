import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await connectDB();
    
    const post = await ScheduledPost.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: '予約投稿をキャンセルしました' });
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return NextResponse.json(
      { error: '予約投稿のキャンセルに失敗しました' },
      { status: 500 }
    );
  }
}