import { NextRequest, NextResponse } from 'next/server';
import * as line from '@line/bot-sdk';
import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';

// クライアントの初期化は実行時に行う
let client: line.messagingApi.MessagingApiClient;


// MongoDB接続
async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  return client.db('oyafukou_db');
}

// LINEユーザーIDから店舗を特定
async function getStoreByLineUserId(lineUserId: string) {
  const db = await connectToDatabase();
  const manager = await db.collection('managers').findOne({ lineUserId, isActive: true });
  
  if (!manager) return null;
  
  const { ObjectId } = await import('mongodb');
  const store = await db.collection('stores').findOne({ _id: new ObjectId(manager.storeId) });
  return store;
}

// 店長コメントを更新
async function updateManagerComment(storeId: string, comment: string) {
  const db = await connectToDatabase();
  const { ObjectId } = await import('mongodb');
  const result = await db.collection('stores').updateOne(
    { _id: new ObjectId(storeId) },
    { 
      $set: { 
        managerComment: comment,
        lastUpdated: new Date()
      } 
    }
  );
  return result.modifiedCount > 0;
}

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
      console.error('LINE credentials not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    // クライアントの初期化
    if (!client) {
      client = new line.messagingApi.MessagingApiClient({
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      });
    }

    // 署名検証
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');
    
    if (!signature || !line.validateSignature(body, process.env.LINE_CHANNEL_SECRET, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const events = JSON.parse(body).events;

    for (const event of events) {
      // メッセージイベント以外はスキップ
      if (event.type !== 'message') continue;

      const lineUserId = event.source.userId;
      
      // 店舗を特定
      const store = await getStoreByLineUserId(lineUserId);
      
      if (!store) {
        // 未登録ユーザーへの返信
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: '申し訳ございません。あなたのLINEアカウントは登録されていません。\n管理者にお問い合わせください。'
          }]
        });
        continue;
      }

      // テキストメッセージの処理
      if (event.message.type === 'text') {
        const messageText = event.message.text;

        // コメントを更新
        const success = await updateManagerComment(store._id.toString(), messageText);

        if (success) {
          // 成功メッセージ
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: `✅ ${store.name}の店長コメントを更新しました！`
              },
              {
                type: 'text',
                text: `更新内容:\n${messageText}`
              }
            ]
          });
        } else {
          // エラーメッセージ
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: 'text',
              text: '❌ 更新に失敗しました。もう一度お試しください。'
            }]
          });
        }
      }
      // 画像メッセージの処理
      else if (event.message.type === 'image') {
        try {
          // LINE から画像を取得
          const blobClient = new line.messagingApi.MessagingApiBlobClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
          });
          const stream = await blobClient.getMessageContent(event.message.id);
          const chunks: Uint8Array[] = [];
          
          // ストリームからデータを読み取る
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          // Vercel Blob に画像をアップロード
          const filename = `manager-photos/${store._id}_${Date.now()}.jpg`;
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'image/jpeg'
          });

          // データベースを更新
          const db = await connectToDatabase();
          const { ObjectId } = await import('mongodb');
          await db.collection('stores').updateOne(
            { _id: new ObjectId(store._id.toString()) },
            { 
              $set: { 
                managerPhoto: blob.url,
                lastUpdated: new Date()
              } 
            }
          );

          // 成功メッセージ
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: 'text',
              text: `✅ ${store.name}のマネージャー写真を更新しました！`
            }]
          });
        } catch (error) {
          console.error('画像アップロードエラー:', error);
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: 'text',
              text: '❌ 画像のアップロードに失敗しました。もう一度お試しください。'
            }]
          });
        }
      }
      // その他のメッセージタイプ
      else {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: 'テキストメッセージまたは画像を送信してください。\n\nテキスト: 店長コメントを更新\n画像: マネージャー写真を更新'
          }]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}