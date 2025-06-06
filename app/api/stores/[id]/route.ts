import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/models/Store';
import { isStoreOpenToday } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const store = await Store.findById(id);
    
    if (!store) {
      return NextResponse.json(
        { error: '店舗が見つかりません' },
        { status: 404 }
      );
    }
    
    // 営業状態を曜日に基づいて更新
    const storeObj = store.toObject();
    storeObj.isOpen = isStoreOpenToday(storeObj.closedDays || [], storeObj.temporaryClosed);
    
    return NextResponse.json(storeObj);
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: '店舗情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updatedStore = await Store.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!updatedStore) {
      return NextResponse.json(
        { error: '店舗が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: '店舗情報の更新に失敗しました' },
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
    const deletedStore = await Store.findByIdAndDelete(id);
    
    if (!deletedStore) {
      return NextResponse.json(
        { error: '店舗が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: '店舗を削除しました' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: '店舗の削除に失敗しました' },
      { status: 500 }
    );
  }
}