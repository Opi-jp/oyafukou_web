import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TwitterToken from '@/models/TwitterToken';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    const account = await TwitterToken.findByIdAndUpdate(
      id,
      { 
        isActive: body.isActive,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!account) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating Twitter account:', error);
    return NextResponse.json(
      { error: 'アカウントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const account = await TwitterToken.findByIdAndDelete(id);
    
    if (!account) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'アカウントを削除しました' });
  } catch (error) {
    console.error('Error deleting Twitter account:', error);
    return NextResponse.json(
      { error: 'アカウントの削除に失敗しました' },
      { status: 500 }
    );
  }
}