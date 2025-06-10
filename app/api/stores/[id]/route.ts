import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/models/Store';
import { isStoreOpenToday } from '@/lib/utils';
import { sendSlackNotification, createStoreUpdateMessage } from '@/lib/slack';
import { sendLineNotification, createRegistrationCompleteMessage } from '@/lib/line';

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
    
    // スタッフ本登録の処理
    if (body.updateType === 'completeStaffRegistration') {
      const { staffData } = body;
      
      // MongoDBの直接操作が必要
      const { MongoClient, ObjectId } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      
      const db = client.db('parent_site_admin');
      
      // スタッフ情報を更新（仮登録→本登録）
      const result = await db.collection('stores').updateOne(
        { 
          _id: new ObjectId(id),
          'staffMembers.lineUserId': staffData.lineUserId 
        },
        { 
          $set: { 
            'staffMembers.$.name': staffData.name,
            'staffMembers.$.photo': staffData.photo,
            'staffMembers.$.phone': staffData.phone,
            'staffMembers.$.email': staffData.email,
            'staffMembers.$.isTemporary': false,
            'staffMembers.$.isActive': true,
            'staffMembers.$.registeredAt': new Date(),
            lastUpdated: new Date()
          } 
        }
      );
      
      await client.close();
      
      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: 'スタッフ情報の更新に失敗しました' },
          { status: 400 }
        );
      }
      
      // 更新後の店舗情報を取得
      const updatedStore = await Store.findById(id);
      
      // Slack通知
      const slackMessage = createStoreUpdateMessage(
        updatedStore.name,
        'update',
        'スタッフ本登録',
        [`${staffData.name}（${staffData.role || 'スタッフ'}）が本登録を完了`]
      );
      await sendSlackNotification(slackMessage);
      
      // LINE通知
      const lineMessage = createRegistrationCompleteMessage(
        updatedStore.name,
        staffData.name,
        staffData.role || 'スタッフ'
      );
      await sendLineNotification(staffData.lineUserId, lineMessage);
      
      return NextResponse.json(updatedStore);
    }
    
    // スタッフ名更新の処理
    if (body.updateType === 'updateStaffName') {
      const { lineUserId, name } = body;
      
      const { MongoClient, ObjectId } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      
      const db = client.db('parent_site_admin');
      
      const result = await db.collection('stores').updateOne(
        { 
          _id: new ObjectId(id),
          'staffMembers.lineUserId': lineUserId 
        },
        { 
          $set: { 
            'staffMembers.$.name': name,
            lastUpdated: new Date()
          } 
        }
      );
      
      await client.close();
      
      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: 'スタッフ名の更新に失敗しました' },
          { status: 400 }
        );
      }
      
      const updatedStore = await Store.findById(id);
      return NextResponse.json(updatedStore);
    }
    
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