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


// スタッフを店舗に追加
async function addStaffMember(storeId: string, lineUserId: string, name: string, role: string) {
  try {
    console.log('addStaffMember called with:', { storeId, lineUserId, name, role });
    
    const uri = process.env.MONGODB_URI!;
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('parent_site_admin');
    const { ObjectId } = await import('mongodb');
    
    // 既に登録されているかチェック
    const store = await db.collection('stores').findOne({ 
      _id: new ObjectId(storeId),
      'staffMembers.lineUserId': lineUserId 
    });
    
    if (store) {
      console.log('Staff already registered for store:', store.name);
      await client.close();
      return { success: false, message: '既にスタッフ登録されています' };
    }
    
    // staffMembersフィールドが存在しない場合は初期化
    const storeExists = await db.collection('stores').findOne({ _id: new ObjectId(storeId) });
    if (!storeExists) {
      console.error('Store not found:', storeId);
      await client.close();
      return { success: false, message: '店舗が見つかりません' };
    }
    
    if (!storeExists.staffMembers) {
      console.log('Initializing staffMembers array for store:', storeExists.name);
      await db.collection('stores').updateOne(
        { _id: new ObjectId(storeId) },
        { $set: { staffMembers: [] } }
      );
    }
    
    const result = await db.collection('stores').updateOne(
      { _id: new ObjectId(storeId) },
      { 
        $push: { 
          staffMembers: {
            lineUserId: lineUserId,
            name: name,
            role: role,
            isActive: true,
            addedAt: new Date()
          }
        } as any,
        $set: { lastUpdated: new Date() }
      } as any
    );
    
    console.log('Update result:', { modifiedCount: result.modifiedCount, acknowledged: result.acknowledged });
    
    await client.close();
    return { success: result.modifiedCount > 0, message: '' };
  } catch (error) {
    console.error('Error in addStaffMember:', error);
    return { success: false, message: 'エラーが発生しました' };
  }
}

// LINE IDからスタッフ情報を取得
async function getStaffByLineUserId(lineUserId: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db('parent_site_admin');
  const store = await db.collection('stores').findOne({
    'staffMembers.lineUserId': lineUserId,
    'staffMembers.isActive': true
  });
  
  await client.close();
  
  if (!store) return null;
  
  const staff = store.staffMembers.find(
    (s: { lineUserId: string; isActive: boolean }) => s.lineUserId === lineUserId && s.isActive
  );
  
  return { store, staff };
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
  console.log('=== LINE Webhook Called ===');
  console.log('Time:', new Date().toISOString());
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
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
    
    // デバッグ用: 署名検証の詳細をログ
    console.log('Signature verification:');
    console.log('- Has signature:', !!signature);
    console.log('- Body length:', body.length);
    console.log('- First 100 chars of body:', body.substring(0, 100));
    
    if (!signature || !line.validateSignature(body, process.env.LINE_CHANNEL_SECRET, signature)) {
      console.error('Signature validation failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const events = JSON.parse(body).events;
    
    // デバッグ用ログ
    console.log('Webhook received:', JSON.stringify(events, null, 2));
    console.log('Total events:', events.length);
    console.log('Event types:', events.map((e: any) => e.type).join(', '));

    for (const event of events) {
      const lineUserId = event.source.userId;
      console.log('Processing event for user:', lineUserId);

      // 友だち追加イベントの処理
      if (event.type === 'follow') {
        console.log('=== Follow Event Detected ===');
        console.log('User ID:', lineUserId);
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
            const rolePattern = /^役職選択:([a-f0-9]{24}):(.+):(.+)$/;
            
            const match = messageText.match(registrationPattern);
            const roleMatch = messageText.match(rolePattern);
            
            if (match) {
              const [, storeId, storeName] = match;
              
              // 役職選択を促す
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                  type: 'text',
                  text: `${storeName}を選択しました。\n\nあなたの役職を選択してください：`,
                  quickReply: {
                    items: [
                      {
                        type: 'action',
                        action: {
                          type: 'message',
                          label: '店長',
                          text: `役職選択:${storeId}:${storeName}:店長`
                        }
                      },
                      {
                        type: 'action',
                        action: {
                          type: 'message',
                          label: 'マネージャー',
                          text: `役職選択:${storeId}:${storeName}:マネージャー`
                        }
                      },
                      {
                        type: 'action',
                        action: {
                          type: 'message',
                          label: 'スタッフ',
                          text: `役職選択:${storeId}:${storeName}:スタッフ`
                        }
                      },
                      {
                        type: 'action',
                        action: {
                          type: 'message',
                          label: 'アルバイト',
                          text: `役職選択:${storeId}:${storeName}:アルバイト`
                        }
                      }
                    ]
                  }
                }]
              });
              continue;
            }
            
            // 役職選択の処理（シンプル版：名前は後から管理画面で設定）
            if (roleMatch) {
              const [, storeId, storeName, role] = roleMatch;
              console.log('=== Staff Registration ===');
              console.log('Store ID:', storeId);
              console.log('Store Name:', storeName);
              console.log('Role:', role);
              console.log('Line User ID:', lineUserId);
              
              // スタッフメンバーとして登録
              const result = await addStaffMember(storeId, lineUserId, role, role);
              console.log('Registration result:', result);
              
              if (result.success) {
                // 管理画面のURLを生成
                const adminUrl = `https://oyafukou-web.vercel.app/admin/stores/${storeId}/staff-comments`;
                
                await client.replyMessage({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: `✅ ${storeName}への登録が完了しました！\n\n登録情報：\n・役職：${role}\n\nこれから以下の情報を送信できます：\n・テキスト → コメント更新\n・画像 → プロフィール写真更新\n\n※お名前は管理画面から設定してください\n${adminUrl}`
                  }]
                });
                
                // Slack通知
                const slackMessage = createLineUpdateMessage(
                  storeName,
                  role,
                  'comment',
                  `新規スタッフ登録: ${role}`
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
          
          // 既存の店舗管理者として登録されているか確認
          const store = await getStoreByLineUserId(lineUserId);
          
          // スタッフメンバーとして登録されているか確認
          const staffInfo = await getStaffByLineUserId(lineUserId);
          
          if (!store && !staffInfo) {
            // 未登録ユーザーへの返信
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: '申し訳ございません。あなたのLINEアカウントは登録されていません。\n「登録」と送信して登録を開始してください。'
              }]
            });
            continue;
          }

      // テキストメッセージの処理
      if (event.message.type === 'text') {
        const messageText = event.message.text;

        // 旧システム（店舗管理者）の場合
        if (store) {
          const success = await updateManagerComment(store._id.toString(), messageText);

          if (success) {
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
            
            const slackMessage = createLineUpdateMessage(
              store.name,
              store.managerName || 'マネージャー',
              'comment',
              messageText
            );
            await sendSlackNotification(slackMessage);
          } else {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: '❌ 更新に失敗しました。もう一度お試しください。'
              }]
            });
          }
        }
        // 新システム（スタッフメンバー）の場合
        else if (staffInfo) {
          const { store: staffStore, staff } = staffInfo;
          console.log('=== Staff Comment Update ===');
          console.log('Store:', staffStore.name);
          console.log('Staff:', staff.name, `(${staff.role})`);
          console.log('Comment:', messageText);
          
          try {
            // スタッフコメントを追加して即時公開
            const uri = process.env.MONGODB_URI!;
            const mongoClient = new MongoClient(uri);
            await mongoClient.connect();
            
            const db = mongoClient.db('parent_site_admin');
            const { ObjectId } = await import('mongodb');
            
            // コメントを履歴に追加
            const updateResult = await db.collection('stores').updateOne(
            { _id: new ObjectId(staffStore._id) },
            {
              $push: {
                staffComments: {
                  staffLineUserId: lineUserId,
                  staffName: staff.name,
                  staffRole: staff.role,
                  staffPhoto: staff.photo || '',
                  comment: messageText,
                  isApproved: true,
                  isActive: true,
                  createdAt: new Date()
                } as any
              } as any,
              $set: { 
                // アクティブコメントとして即時設定
                activeStaffComment: {
                  staffLineUserId: lineUserId,
                  staffName: staff.name,
                  staffRole: staff.role,
                  staffPhoto: staff.photo || '',
                  comment: messageText,
                  updatedAt: new Date()
                },
                lastUpdated: new Date() 
              }
            }
          );
          
          console.log('Update result:', { modifiedCount: updateResult.modifiedCount });
          
          await mongoClient.close();
          
          if (updateResult.modifiedCount > 0) {
            await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: 'text',
              text: `✅ コメントを更新しました！\n\n投稿者：${staff.name}（${staff.role}）\n内容：${messageText}\n\n※ウェブサイトに反映されました`
            }]
          });
          
            // Slack通知
            const slackMessage = createLineUpdateMessage(
              staffStore.name,
              `${staff.name}（${staff.role}）`,
              'comment',
              messageText
            );
            await sendSlackNotification(slackMessage);
          } else {
            console.error('Failed to update comment');
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: '❌ コメントの更新に失敗しました。もう一度お試しください。'
              }]
            });
          }
          } catch (error) {
            console.error('Error updating staff comment:', error);
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: '❌ エラーが発生しました。もう一度お試しください。'
              }]
            });
          }
        }
      }
      // 画像メッセージの処理
      else if (event.message.type === 'image') {
        // 新システム（スタッフメンバー）の場合
        if (staffInfo) {
          const { store: staffStore, staff } = staffInfo;
          
          try {
            // LINE から画像を取得
            const blobClient = new line.messagingApi.MessagingApiBlobClient({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            });
            const stream = await blobClient.getMessageContent(event.message.id);
            const chunks: Uint8Array[] = [];
            
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            
            // Vercel Blob に画像をアップロード
            const filename = `staff-photos/${staffStore._id}_${staff.lineUserId}_${Date.now()}.jpg`;
            const blob = await put(filename, buffer, {
              access: 'public',
              contentType: 'image/jpeg'
            });

            // スタッフメンバーの写真を更新
            const uri = process.env.MONGODB_URI!;
            const updateClient = new MongoClient(uri);
            await updateClient.connect();
            
            const db = updateClient.db('parent_site_admin');
            const { ObjectId } = await import('mongodb');
            
            await db.collection('stores').updateOne(
              { 
                _id: new ObjectId(staffStore._id),
                'staffMembers.lineUserId': lineUserId
              },
              { 
                $set: { 
                  'staffMembers.$.photo': blob.url,
                  lastUpdated: new Date()
                } 
              }
            );
            
            await updateClient.close();

            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: `✅ プロフィール写真を更新しました！\n\n${staff.name}（${staff.role}）`
              }]
            });
            
            // Slack通知
            const slackMessage = createLineUpdateMessage(
              staffStore.name,
              `${staff.name}（${staff.role}）`,
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
          continue;
        }
        
        // 旧システム（店舗管理者）の場合
        if (store) {
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