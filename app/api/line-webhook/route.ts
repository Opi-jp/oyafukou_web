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


// スタッフを仮登録（LINE IDと役職のみ保存、詳細はWeb登録）
async function addStaffMember(storeId: string, lineUserId: string, name: string, role: string, photo?: string) {
  try {
    console.log('addStaffMember called with:', { storeId, lineUserId, role });
    
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
      console.log('Staff already registered, updating role for store:', store.name);
      // 既存のスタッフ情報を更新
      const updateData: any = {
        'staffMembers.$.role': role,
        'staffMembers.$.isTemporary': true,  // 仮登録フラグ
        'staffMembers.$.isActive': false,    // Web登録完了まで非アクティブ
        lastUpdated: new Date()
      };
      
      // 写真URLがある場合は追加
      if (photo) {
        updateData['staffMembers.$.photo'] = photo;
      }
      
      const updateResult = await db.collection('stores').updateOne(
        { 
          _id: new ObjectId(storeId),
          'staffMembers.lineUserId': lineUserId 
        },
        { 
          $set: updateData
        }
      );
      
      await client.close();
      return { success: updateResult.modifiedCount > 0, message: '役職を更新しました' };
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
    
    const staffMember: any = {
      lineUserId: lineUserId,
      name: '未設定',  // Web登録時に設定
      role: role,
      isTemporary: true,  // 仮登録フラグ
      isActive: false,    // Web登録完了まで非アクティブ
      addedAt: new Date()
    };
    
    // 写真URLがある場合は追加
    if (photo) {
      staffMember.photo = photo;
    }
    
    const result = await db.collection('stores').updateOne(
      { _id: new ObjectId(storeId) },
      { 
        $push: { 
          staffMembers: staffMember
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

// LINE IDからスタッフ情報を取得（複数店舗対応）
async function getStaffByLineUserId(lineUserId: string) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db('parent_site_admin');
  // 複数店舗を取得（アクティブかつ本登録済みのみ）
  const stores = await db.collection('stores').find({
    'staffMembers.lineUserId': lineUserId,
    'staffMembers.isActive': true,
    'staffMembers.isTemporary': { $ne: true }
  }).toArray();
  
  await client.close();
  
  if (!stores || stores.length === 0) return null;
  
  // 各店舗のスタッフ情報を抽出
  const staffInfoList = stores.map(store => {
    const staff = store.staffMembers.find(
      (s: { lineUserId: string; isActive: boolean }) => s.lineUserId === lineUserId && s.isActive
    );
    return { store, staff };
  });
  
  // 単一店舗の場合は従来の形式で返す
  if (staffInfoList.length === 1) {
    return staffInfoList[0];
  }
  
  // 複数店舗の場合
  return { stores: staffInfoList, isMultiple: true };
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
            const commentUpdatePattern = /^コメント更新:([a-f0-9]{24}):(.+)$/;
            
            const match = messageText.match(registrationPattern);
            const roleMatch = messageText.match(rolePattern);
            const commentMatch = messageText.match(commentUpdatePattern);
            
            // コメント更新（複数店舗対応）
            if (commentMatch) {
              const [, storeId, comment] = commentMatch;
              console.log('=== Comment Update (Multiple Store Support) ===');
              console.log('Store ID:', storeId);
              console.log('Comment:', comment);
              
              try {
                // 指定された店舗のスタッフ情報を取得
                const uri = process.env.MONGODB_URI!;
                const mongoClient = new MongoClient(uri);
                await mongoClient.connect();
                
                const db = mongoClient.db('parent_site_admin');
                const { ObjectId } = await import('mongodb');
                
                // 店舗情報とスタッフ情報を取得
                const store = await db.collection('stores').findOne({
                  _id: new ObjectId(storeId),
                  'staffMembers.lineUserId': lineUserId,
                  'staffMembers.isActive': true
                });
                
                if (!store) {
                  await mongoClient.close();
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: '❌ 指定された店舗に登録されていません。'
                    }]
                  });
                  continue;
                }
                
                const staff = store.staffMembers.find(
                  (s: { lineUserId: string; isActive: boolean }) => s.lineUserId === lineUserId && s.isActive
                );
                
                // コメントを履歴に追加して即時公開
                const updateResult = await db.collection('stores').updateOne(
                  { _id: new ObjectId(storeId) },
                  {
                    $push: {
                      staffComments: {
                        staffLineUserId: lineUserId,
                        staffName: staff.name,
                        staffRole: staff.role,
                        staffPhoto: staff.photo || '',
                        comment: comment,
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
                        comment: comment,
                        updatedAt: new Date()
                      },
                      lastUpdated: new Date() 
                    }
                  }
                );
                
                await mongoClient.close();
                
                if (updateResult.modifiedCount > 0) {
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: `✅ ${store.name}のコメントを更新しました！\n\n投稿者：${staff.name}（${staff.role}）\n内容：${comment}\n\n※ウェブサイトに反映されました`
                    }]
                  });
                  
                  // Slack通知
                  const slackMessage = createLineUpdateMessage(
                    store.name,
                    `${staff.name}（${staff.role}）`,
                    'comment',
                    comment
                  );
                  await sendSlackNotification(slackMessage);
                } else {
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: '❌ コメントの更新に失敗しました。'
                    }]
                  });
                }
              } catch (error) {
                console.error('Error updating comment (multiple store):', error);
                await client.replyMessage({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: '❌ エラーが発生しました。もう一度お試しください。'
                  }]
                });
              }
              continue;
            }
            
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
            
            // 役職選択の処理（LINE プロフィール情報を取得）
            if (roleMatch) {
              const [, storeId, storeName, role] = roleMatch;
              console.log('=== Staff Registration ===');
              console.log('Store ID:', storeId);
              console.log('Store Name:', storeName);
              console.log('Role:', role);
              console.log('Line User ID:', lineUserId);
              
              try {
                // LINE プロフィールを取得
                const profile = await client.getProfile(lineUserId);
                console.log('LINE Profile:', { displayName: profile.displayName, pictureUrl: profile.pictureUrl });
                
                // スタッフメンバーとして登録（LINE表示名とプロフィール画像を使用）
                const result = await addStaffMember(
                  storeId, 
                  lineUserId, 
                  profile.displayName || role, // LINE表示名を使用、なければ役職名
                  role,
                  profile.pictureUrl // プロフィール画像URL
                );
                console.log('Registration result:', result);
                
                if (result.success) {
                  // Web登録画面のURLを生成
                  const registrationUrl = `https://oyafukou-web.vercel.app/admin/stores/${storeId}/staff-register?lineUserId=${lineUserId}&role=${encodeURIComponent(role)}`;
                  
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: `📝 ${storeName}への仮登録を受け付けました。\n\n【重要】本登録を完了してください：\n${registrationUrl}\n\n役職：${role}\n\n※本登録完了後にコメント投稿が可能になります。`
                    }]
                  });
                  
                  // Slack通知
                  const slackMessage = createLineUpdateMessage(
                    storeName,
                    `${profile.displayName}（${role}）`,
                    'comment',
                    isUpdate ? `スタッフ情報更新: ${role}` : `新規スタッフ登録: ${role}`
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
              } catch (error) {
                console.error('Error getting LINE profile or registering staff:', error);
                // プロフィール取得に失敗した場合でも登録を続行（役職名を使用）
                const result = await addStaffMember(storeId, lineUserId, role, role);
                
                if (result.success) {
                  const isUpdate = result.message === '役職を更新しました';
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: `✅ ${storeName}への${isUpdate ? '登録情報を更新' : '登録が完了'}しました！\n\n登録情報：\n・役職：${role}\n\nこれから以下の情報を送信できます：\n・テキスト → コメント更新\n・画像 → プロフィール写真更新`
                    }]
                  });
                } else {
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: `❌ 登録に失敗しました: ${result.message}`
                    }]
                  });
                }
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
                text: '⚠️ まだ本登録が完了していません。\n\n仮登録済みの場合は、送られたURLから本登録を完了してください。\n\n初めての場合は「登録」と送信してください。'
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
              // 複数店舗の場合
              if ('isMultiple' in staffInfo && staffInfo.isMultiple) {
                console.log('=== Multiple Stores Detected ===');
                console.log('Stores:', staffInfo.stores.map((s: any) => s.store.name).join(', '));
                
                // 店舗選択のクイックリプライを表示
                await client.replyMessage({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: '複数の店舗に登録されています。\nコメントを更新する店舗を選択してください：',
                    quickReply: {
                      items: staffInfo.stores.map((info: any) => ({
                        type: 'action',
                        action: {
                          type: 'message',
                          label: info.store.name,
                          text: `コメント更新:${info.store._id}:${messageText}`
                        }
                      }))
                    }
                  }]
                });
                continue;
              }
              
              // 単一店舗の場合（従来の処理）
              const { store: staffStore, staff } = staffInfo as { store: any; staff: any };
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
              // 複数店舗の場合
              if ('isMultiple' in staffInfo && staffInfo.isMultiple) {
                console.log('=== Multiple Stores for Photo Update ===');
                console.log('Stores:', staffInfo.stores.map((s: any) => s.store.name).join(', '));
                
                // 画像を一時的に保存してから店舗選択を促す
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
                  
                  // Vercel Blob に画像を一時アップロード
                  const tempFilename = `temp-staff-photos/${lineUserId}_${Date.now()}.jpg`;
                  const tempBlob = await put(tempFilename, buffer, {
                    access: 'public',
                    contentType: 'image/jpeg'
                  });
                  
                  // 全店舗のプロフィール写真を一括更新
                  const uri = process.env.MONGODB_URI!;
                  const updateClient = new MongoClient(uri);
                  await updateClient.connect();
                  
                  const db = updateClient.db('parent_site_admin');
                  const { ObjectId } = await import('mongodb');
                  
                  // 複数店舗を一括更新
                  const updatePromises = staffInfo.stores.map(async (info: any) => {
                    return db.collection('stores').updateOne(
                      { 
                        _id: new ObjectId(info.store._id),
                        'staffMembers.lineUserId': lineUserId
                      },
                      { 
                        $set: { 
                          'staffMembers.$.photo': tempBlob.url,
                          lastUpdated: new Date()
                        } 
                      }
                    );
                  });
                  
                  await Promise.all(updatePromises);
                  await updateClient.close();
                  
                  const storeNames = staffInfo.stores.map((info: any) => info.store.name).join('、');
                  await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                      type: 'text',
                      text: `✅ 以下の店舗のプロフィール写真を更新しました！\n\n${storeNames}`
                    }]
                  });
                  
                  // Slack通知（各店舗に対して）
                  for (const info of staffInfo.stores) {
                    const slackMessage = createLineUpdateMessage(
                      info.store.name,
                      `${info.staff.name}（${info.staff.role}）`,
                      'photo'
                    );
                    await sendSlackNotification(slackMessage);
                  }
                } catch (error) {
                  console.error('画像アップロードエラー（複数店舗）:', error);
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
              
              // 単一店舗の場合（従来の処理）
              const { store: staffStore, staff } = staffInfo as { store: any; staff: any };
          
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