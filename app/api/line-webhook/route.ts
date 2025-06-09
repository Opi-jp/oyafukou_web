import { NextRequest, NextResponse } from 'next/server';
import * as line from '@line/bot-sdk';
import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';

// クライアントの初期化は実行時に行う
let client: line.messagingApi.MessagingApiClient;


// MongoDB接続
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  // URIからデータベース名を抽出
  const dbName = uri.split('/').pop()?.split('?')[0] || 'oyafukou_db';
  console.log('Connecting to database:', dbName);
  
  return client.db(dbName);
}

// LINEユーザーIDから店舗を特定
async function getStoreByLineUserId(lineUserId: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  // マネージャーは oyafukou_db に存在
  const managerDb = client.db('oyafukou_db');
  console.log('Searching for manager with lineUserId:', lineUserId);
  
  const manager = await managerDb.collection('managers').findOne({ lineUserId, isActive: true });
  console.log('Found manager:', manager);
  
  if (!manager) {
    await client.close();
    return null;
  }
  
  // 店舗は parent_site_admin に存在
  const storeDb = client.db('parent_site_admin');
  const { ObjectId } = await import('mongodb');
  console.log('Searching for store with ID:', manager.storeId);
  const store = await storeDb.collection('stores').findOne({ _id: new ObjectId(manager.storeId) });
  console.log('Found store:', store?.name || 'Not found');
  
  await client.close();
  return store;
}

// 店長コメントを更新
async function updateManagerComment(storeId: string, comment: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  // 店舗は parent_site_admin に存在
  const db = client.db('parent_site_admin');
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
  
  await client.close();
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
    
    // デバッグ用ログ
    console.log('Webhook received:', JSON.stringify(events, null, 2));

    for (const event of events) {
      const lineUserId = event.source.userId;
      console.log('Processing event for user:', lineUserId);

      // 友だち追加イベントの処理
      if (event.type === 'follow') {
        // 友だち追加メッセージ
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: `こんにちは！八丈島親不孝通り更新システムです。\n\n【店長登録の手順】\n1. このメッセージのスクリーンショットを撮影\n2. 管理者に送信して登録を依頼\n3. 登録完了の連絡を待つ\n\n【あなたのLINE ID】\n${lineUserId}\n\n※このIDを管理者にお伝えください`
          }]
        });
        continue;
      }

      // メッセージイベントの処理
      if (event.type === 'message') {
        try {
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
          const uri = process.env.MONGODB_URI!;
          const updateClient = new MongoClient(uri);
          await updateClient.connect();
          
          // 店舗は parent_site_admin に存在
          const db = updateClient.db('parent_site_admin');
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
          
          await updateClient.close();

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
        } catch (messageError) {
          console.error('Message processing error:', messageError);
          // エラー時でもレスポンスを返す
          try {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: '⚠️ エラーが発生しました。しばらくしてからもう一度お試しください。'
              }]
            });
          } catch (replyError) {
            console.error('Reply error:', replyError);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}