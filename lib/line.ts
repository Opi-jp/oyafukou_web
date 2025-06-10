import * as line from '@line/bot-sdk';

// LINE通知を送信する関数
export async function sendLineNotification(lineUserId: string, message: string) {
  try {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
      return false;
    }

    const client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });

    await client.pushMessage({
      to: lineUserId,
      messages: [{
        type: 'text',
        text: message
      }]
    });

    console.log('LINE notification sent successfully to:', lineUserId);
    return true;
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
    return false;
  }
}

// スタッフ登録完了通知
export function createRegistrationCompleteMessage(storeName: string, staffName: string, role: string): string {
  return `🎉 本登録が完了しました！

【登録情報】
店舗：${storeName}
お名前：${staffName}
役職：${role}

【これからできること】
📝 テキストを送信 → お店のコメントを更新
📷 画像を送信 → プロフィール写真を更新

※複数店舗に所属している場合は、送信時に店舗を選択できます。

それでは、さっそくコメントを送信してみてください！`;
}