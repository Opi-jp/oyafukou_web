import { NextRequest, NextResponse } from 'next/server';
import * as line from '@line/bot-sdk';
import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';
import { sendSlackNotification, createLineUpdateMessage } from '@/lib/slack';

// クライアントの初期化は実行時に行う
let client: line.messagingApi.MessagingApiClient;

// LINEユーザーIDから店舗を特定
async function getStoreByLineUserId(lineUserId: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  // 店舗は parent_site_admin に存在（LINE情報も含む）
  const db = client.db('parent_site_admin');
  console.log('Searching for store with lineUserId:', lineUserId);
  
  const store = await db.collection('stores').findOne({ 
    lineUserId: lineUserId,
    lineManagerActive: true 
  });
  console.log('Found store:', store?.name || 'Not found');
  
  await client.close();
  return store;
}

// 全店舗を取得
async function getAllStores() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db('parent_site_admin');
  const stores = await db.collection('stores')
    .find({})
    .project({ _id: 1, name: 1 })
    .toArray();
  
  await client.close();
  return stores;
}

// LINE IDを店舗に登録
async function registerLineUser(storeId: string, lineUserId: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db('parent_site_admin');
  const { ObjectId } = await import('mongodb');
  
  // 既に他の店舗に登録されていないかチェック
  const existingStore = await db.collection('stores').findOne({ lineUserId });
  if (existingStore) {
    await client.close();
    return { success: false, message: `既に${existingStore.name}に登録されています` };
  }
  
  const result = await db.collection('stores').updateOne(
    { _id: new ObjectId(storeId) },
    { 
      $set: { 
        lineUserId: lineUserId,
        lineManagerActive: true,
        lastUpdated: new Date()
      } 
    }
  );
  
  await client.close();
  return { success: result.modifiedCount > 0, message: '' };
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
        // 全店舗を取得
        const stores = await getAllStores();
        
        // クイックリプライで店舗選択を促す
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: 'こんにちは！八丈島親不孝通りの更新システムです。\n\nあなたの店舗を選択してください：',
            quickReply: {
              items: stores.slice(0, 13).map(store => ({  // LINE APIの制限により最大13個
                type: 'action',
                action: {
                  type: 'message',
                  label: store.name,
                  text: `店舗登録:${store._id}:${store.name}`
                }
              }))
            }
          }]
        });
        continue;
      }

      // メッセージイベントの処理
      if (event.type === 'message') {
        try {
          // テキストメッセージの場合、まず店舗登録パターンをチェック
          if (event.message.type === 'text') {
            const messageText = event.message.text;
            
            // 店舗登録メッセージのパターンマッチ
            const registrationPattern = /^店舗登録:([a-f0-9]{24}):(.+)$/;
            const match = messageText.match(registrationPattern);
            
            if (match) {
              const [, storeId, storeName] = match;
              
              // 店舗にLINE IDを自動登録
              const result = await registerLineUser(storeId, lineUserId);
              
              if (result.success) {
                await client.replyMessage({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: `✅ ${storeName}への登録が完了しました！\n\nこれから以下の情報を送信できます：\n・テキスト → 店長コメント更新\n・画像 → マネージャー写真更新`
                  }]
                });
                
                // Slack通知
                const slackMessage = createLineUpdateMessage(
                  storeName,
                  'システム',
                  'comment',
                  `新規LINE連携: ${lineUserId}`
                );
                await sendSlackNotification(slackMessage);
              } else {
                await client.replyMessage({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: `❌ 登録に失敗しました: ${result.message}`
                  }]
                });
              }
              continue;
            }
            
            // 「登録」というメッセージの場合、店舗選択を再表示
            if (messageText === '登録' || messageText === '店舗登録') {
              const stores = await getAllStores();
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                  type: 'text',
                  text: 'あなたの店舗を選択してください：',
                  quickReply: {
                    items: stores.slice(0, 13).map(store => ({
                      type: 'action',
                      action: {
                        type: 'message',
                        label: store.name,
                        text: `店舗登録:${store._id}:${store.name}`
                      }
                    }))
                  }
                }]
              });
              continue;
            }
          }
          
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
          
          // Slack通知
          const slackMessage = createLineUpdateMessage(
            store.name,
            store.managerName || 'マネージャー',
            'comment',
            messageText
          );
          await sendSlackNotification(slackMessage);
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
          
          // Slack通知
          const slackMessage = createLineUpdateMessage(
            store.name,
            store.managerName || 'マネージャー',
            'photo'
          );
          await sendSlackNotification(slackMessage);
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