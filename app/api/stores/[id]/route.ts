import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/models/Store';
import { isStoreOpenToday } from '@/lib/utils';
import { sendSlackNotification, createStoreUpdateMessage } from '@/lib/slack';

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
    
    // 更新前の店舗情報を取得（変更内容の比較用）
    const oldStore = await Store.findById(id);
    
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
    
    // Slack通知を送信
    if (oldStore) {
      const changes: string[] = [];
      
      // 主要な変更をチェック
      if (oldStore.name !== updatedStore.name) changes.push('店舗名');
      if (oldStore.description !== updatedStore.description) changes.push('説明');
      if (oldStore.openingHours !== updatedStore.openingHours) changes.push('営業時間');
      if (oldStore.managerComment !== updatedStore.managerComment) changes.push('店長コメント');
      if (oldStore.temporaryClosed !== updatedStore.temporaryClosed) {
        changes.push(updatedStore.temporaryClosed ? '臨時休業設定' : '臨時休業解除');
      }
      
      if (changes.length > 0) {
        const slackMessage = createStoreUpdateMessage(
          updatedStore.name,
          'update',
          'Web管理画面',
          changes
        );
        await sendSlackNotification(slackMessage);
      }
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