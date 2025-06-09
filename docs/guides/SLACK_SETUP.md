# Slack通知設定ガイド

このガイドでは、店舗情報の更新をSlackに通知する設定方法を説明します。

## 設定手順

### 1. Slack Webhook URLの取得

1. Slackワークスペースにログイン
2. [Slack App Directory](https://api.slack.com/apps) にアクセス
3. "Create New App" をクリック
4. "From scratch" を選択
5. アプリ名を入力（例：「親不孤通り更新通知」）
6. ワークスペースを選択

### 2. Incoming Webhookの設定

1. 作成したアプリの設定画面で「Incoming Webhooks」をクリック
2. 「Activate Incoming Webhooks」をONにする
3. 「Add New Webhook to Workspace」をクリック
4. 通知を送信したいチャンネルを選択（例：#oyafukou-updates）
5. 生成されたWebhook URLをコピー

### 3. 環境変数の設定

Vercelの環境変数に以下を追加：

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Vercelでの設定方法：
1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下を追加：
   - Key: `SLACK_WEBHOOK_URL`
   - Value: コピーしたWebhook URL
   - Environment: Production, Preview, Development すべてにチェック

### 4. 動作確認

設定後、以下の操作で通知が送信されます：

- **Web管理画面から店舗情報を更新**
  - 店舗名、説明、営業時間、店長コメント、臨時休業の変更時

- **LINE経由での更新**
  - マネージャーがLINEでテキストメッセージ送信（コメント更新）
  - マネージャーがLINEで画像送信（写真更新）

## 通知の内容

### Web更新時の通知例
```
📝 店舗情報更新
店舗名: 居酒屋さくら
更新者: Web管理画面
変更内容:
• 営業時間
• 店長コメント
更新日時: 2025/6/9 18:30:45
```

### LINE更新時の通知例
```
💬 LINE経由でコメント更新
店舗名: 居酒屋さくら
マネージャー: 田中店長
新しいコメント:
本日のおすすめは新鮮なカツオのたたきです！
更新日時: 2025/6/9 19:15:22
```

## トラブルシューティング

### 通知が届かない場合

1. **Webhook URLの確認**
   - URLが正しくコピーされているか確認
   - 環境変数名が `SLACK_WEBHOOK_URL` になっているか確認

2. **チャンネルの確認**
   - Webhookで指定したチャンネルが存在するか確認
   - プライベートチャンネルの場合、アプリが追加されているか確認

3. **ログの確認**
   - Vercelのログで `Slack webhook URL not configured` が出ていないか確認
   - エラーメッセージがある場合は内容を確認

## セキュリティ上の注意

- Webhook URLは秘密情報として扱う
- GitHubなどのリポジトリにコミットしない
- 環境変数として管理する