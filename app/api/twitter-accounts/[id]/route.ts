import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TwitterToken from '@/models/TwitterToken';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    
    const updateData: any = {};
    if ('isActive' in body) updateData.isActive = body.isActive;
    if ('storeId' in body) updateData.storeId = body.storeId;
    if ('storeName' in body) updateData.storeName = body.storeName;
    
    const account = await TwitterToken.findByIdAndUpdate(
      params.id,
      updateData,
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
    console.error('Error updating twitter account:', error);
    return NextResponse.json(
      { error: 'アカウントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const account = await TwitterToken.findByIdAndDelete(params.id);
    
    if (!account) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'アカウントを削除しました' });
  } catch (error) {
    console.error('Error deleting twitter account:', error);
    return NextResponse.json(
      { error: 'アカウントの削除に失敗しました' },
      { status: 500 }
    );
  }
}