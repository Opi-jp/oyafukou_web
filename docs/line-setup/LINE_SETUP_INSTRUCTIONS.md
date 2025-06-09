# LINE連携セットアップ手順

## 1. 環境変数の設定

`.env.local`ファイルに以下を追加してください：

```
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=（LINE Developersから取得）
LINE_CHANNEL_SECRET=fab3332e7698f60fc8aabc2303db096e
```

**重要**: Channel Access Tokenは[LINE Developers Console](https://developers.line.biz/)から発行する必要があります。

## 2. Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトの設定ページへ移動
3. "Environment Variables"セクションで以下を追加：
   - `LINE_CHANNEL_ACCESS_TOKEN`: （取得したトークン）
   - `LINE_CHANNEL_SECRET`: fab3332e7698f60fc8aabc2303db096e

## 3. LINE Developersでの設定

1. [LINE Developers](https://developers.line.biz/)にログイン
2. Channel ID: 2007545466 のチャンネルを選択
3. 「Messaging API設定」タブで以下を設定：
   - **Webhook URL**: `https://oyafukou-web.vercel.app/api/line-webhook`
   - **Webhookの利用**: ON
   - **応答メッセージ**: 無効
   - **あいさつメッセージ**: 有効（任意）

## 4. Channel Access Tokenの発行

1. 「Messaging API設定」タブの下部
2. 「チャンネルアクセストークン（長期）」セクション
3. 「発行」ボタンをクリック
4. 発行されたトークンをコピーして環境変数に設定

## 5. 動作確認

1. LINEでボットを友だち追加
2. 管理画面（/admin/line-managers）でLINEユーザーIDと店舗を紐付け
3. LINEでメッセージを送信して動作確認

## 実装済み機能

- ✅ テキストメッセージ → 店長コメント更新
- ✅ 画像メッセージ → マネージャー写真更新
- ✅ 未登録ユーザーへのエラーメッセージ
- ✅ 更新成功/失敗の通知

## LINE友だち追加URL

```
https://line.me/R/ti/p/@2007545466
```

または QRコードを LINE Developers Console から取得してください。