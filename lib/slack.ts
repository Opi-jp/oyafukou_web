interface SlackMessage {
  text: string;
  blocks?: any[];
}

export async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  // Slack Webhook URLが設定されていない場合はスキップ
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

// 店舗更新通知
export function createStoreUpdateMessage(
  storeName: string,
  updateType: 'create' | 'update' | 'delete',
  updatedBy: string = 'Admin',
  changes?: string[]
): SlackMessage {
  const emoji = {
    create: '🆕',
    update: '📝',
    delete: '🗑️'
  }[updateType];

  const actionText = {
    create: '新規登録',
    update: '更新',
    delete: '削除'
  }[updateType];

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} 店舗情報${actionText}`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*店舗名:*\n${storeName}`
        },
        {
          type: 'mrkdwn',
          text: `*更新者:*\n${updatedBy}`
        }
      ]
    }
  ];

  if (changes && changes.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*変更内容:*\n${changes.map(c => `• ${c}`).join('\n')}`
      }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `更新日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
      }
    ]
  });

  return {
    text: `${emoji} 店舗「${storeName}」が${actionText}されました`,
    blocks
  };
}

// LINE更新通知
export function createLineUpdateMessage(
  storeName: string,
  managerName: string,
  updateType: 'comment' | 'photo',
  content?: string
): SlackMessage {
  const emoji = updateType === 'comment' ? '💬' : '📷';
  const updateText = updateType === 'comment' ? 'コメント' : '写真';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} LINE経由で${updateText}更新`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*店舗名:*\n${storeName}`
        },
        {
          type: 'mrkdwn',
          text: `*マネージャー:*\n${managerName}`
        }
      ]
    }
  ];

  if (updateType === 'comment' && content) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*新しいコメント:*\n${content}`
      }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `更新日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
      }
    ]
  });

  return {
    text: `${emoji} ${storeName}の${updateText}がLINE経由で更新されました`,
    blocks
  };
}