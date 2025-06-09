# LINE Messaging API 開発者設定ガイド

## 1. LINE Developersでの設定手順

### アカウント作成
1. [LINE Developers](https://developers.line.biz/) にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー」を作成（例：八丈島親不孝通り）

### Messaging APIチャンネル作成
1. 「新規チャンネル作成」→「Messaging API」を選択
2. 以下を入力：
   - チャンネル名: 八丈島親不孝通り店長システム
   - チャンネル説明: 店長コメント自動更新システム
   - 大業種: 飲食店・レストラン
   - 小業種: 居酒屋・バー

### 必要な情報を取得
1. **Channel Access Token（長期）**
   - Messaging API設定 → チャンネルアクセストークン → 発行

2. **Channel Secret**
   - チャンネル基本設定 → Channel Secret

3. **Webhook URL設定**
   - Messaging API設定 → Webhook URL
   - URL: `https://oyafukou-web.vercel.app/api/line-webhook`
   - Webhookの利用: ON

## 2. 環境変数の設定

`.env.local`に以下を追加：
```
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
```

Vercelの環境変数にも同様に設定が必要です。

## 3. QRコードの生成方法

### 基本QRコード
- Messaging API設定 → QRコード

### 店舗別パラメータ付きQRコード
各店舗用のURLを生成してQRコード化：
```
https://line.me/R/ti/p/@{YOUR_CHANNEL_ID}?store=namihei
https://line.me/R/ti/p/@{YOUR_CHANNEL_ID}?store=aigae
https://line.me/R/ti/p/@{YOUR_CHANNEL_ID}?store=regent
```

## 4. 応答メッセージの無効化
自動応答を無効にする：
- Messaging API設定 → 応答メッセージ → 無効

## 5. アカウント機能設定
- あいさつメッセージ: 有効（初回登録時のメッセージ）
- 応答メッセージ: 無効
- Webhook: 有効