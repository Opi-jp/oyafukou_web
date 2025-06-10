# Claude Code メモリーファイル

## プロジェクト概要
八丈島親不孝通り（Hachijojima Oyafukou Street）の公式Webサイト。飲食店街の情報を提供。

## 重要な要件
- 日本語UI必須
- ダークテーマ（背景: #0A0A0A、カード: #1A1A1A）
- アクセントカラー: #FF6B4A（オレンジ系）
- モバイルファースト設計

## API構成
- `/api/stores` - 店舗一覧の取得/作成
- `/api/stores/[id]` - 個別店舗の取得/更新/削除
- `/api/upload` - 画像アップロード（Vercel Blob）
- `/api/line-webhook` - LINE Botのwebhookエンドポイント
- `/api/line-managers` - LINE連携管理者の一覧取得
- `/api/line-managers/[id]` - LINE連携管理者の個別操作

## 管理画面の仕様
- パス: `/admin`
- 認証: 現在は未実装（ユーザーの要望により後回し）
- 機能: 
  - 店舗の追加/編集/削除
  - 画像アップロード（Vercel Blob使用）
  - メニュー管理（おすすめ/通常/ドリンク）
  - LINE連携管理
  - QRコード生成
  - スタッフ管理（複数スタッフ対応）
- サブページ:
  - `/admin/stores/[id]` - 店舗編集
  - `/admin/stores/[id]/menus` - メニュー管理
  - `/admin/stores/[id]/qr-code` - LINE QRコード表示
  - `/admin/stores/[id]/staff-comments` - スタッフコメント履歴管理
  - `/admin/line-managers` - LINE連携一覧

## 店舗データ構造
```typescript
{
  name: string;              // 店舗名
  category: string;          // カテゴリー（居酒屋、焼肉など）
  description: string;       // 説明文
  openingHours: string;      // 営業時間（例: "19:00-3:00"）
  closedDays: string[];      // 定休日
  phone: string;            // 電話番号
  address: string;          // 住所
  
  // 画像
  topImage?: string;        // 一覧用画像
  detailImage1?: string;    // 詳細ページトップ
  detailImage2?: string;    // メニュー後
  exteriorImage?: string;   // 外観（基本情報後）
  managerPhoto?: string;    // マネージャー写真
  
  // メニュー
  menuHighlights: MenuItem[];      // おすすめメニュー
  regularMenu: CategoryMenuItem[]; // 通常メニュー
  drinkMenu: CategoryMenuItem[];   // ドリンクメニュー
  
  // LINE連携（旧システム）
  lineUserId?: string;      // LINE User ID
  lineManagerActive?: boolean; // LINE連携有効フラグ
  
  // スタッフ管理（新システム - 2025年1月追加）
  staffMembers?: [{
    lineUserId: string;
    name: string;
    role: '店長' | 'マネージャー' | 'スタッフ' | 'アルバイト';
    photo?: string;
    isActive: boolean;
    addedAt: Date;
  }];
  
  // スタッフコメント履歴
  staffComments?: [{
    staffLineUserId: string;
    staffName: string;
    staffRole: string;
    staffPhoto?: string;
    comment: string;
    isApproved: boolean;  // 常にtrue（承認不要）
    isActive: boolean;
    createdAt: Date;
  }];
  
  // 現在表示中のスタッフコメント
  activeStaffComment?: {
    staffLineUserId: string;
    staffName: string;
    staffRole: string;
    staffPhoto?: string;
    comment: string;
    updatedAt: Date;
  };
  
  // その他
  managerName?: string;
  managerComment?: string;
  temporaryClosed?: boolean;
  temporaryClosedReason?: string;
}
```

## スタッフコメント機能（2025年1月実装）
### 概要
- 複数スタッフがLINEからコメントを投稿可能
- 役職（店長/マネージャー/スタッフ/アルバイト）に応じて「○○からの一言」と表示
- 承認不要で即時公開（ユーザー要望により変更）
- コメント履歴管理機能付き

### LINE連携フロー（新システム）
1. スタッフが共通QRコード（@983koeyt）から友だち追加
2. 自動表示される店舗リストから所属店舗を選択（クイックリプライ）
3. 役職を選択（クイックリプライ）
4. 登録完了後、テキスト送信でコメント更新、画像送信でプロフィール写真更新

### 管理画面機能
- `/admin/stores/[id]/staff-comments` - コメント履歴管理
  - 全コメント履歴を表示
  - 過去のコメントから表示するものを選択可能
  - コメント削除機能
  - 現在表示中のコメントをハイライト表示

## レイアウト順序（店舗詳細ページ）
1. 詳細画像1（detailImage1）
2. 店舗基本情報（名前、カテゴリー、営業時間）
3. スタッフコメント（写真付き吹き出し）※新システム優先、なければ旧システムの店長コメント
4. メニュー（タブ切り替え）
5. 詳細画像2（detailImage2）
6. 基本情報（住所、電話、定休日）
7. 外観画像（exteriorImage）

## よく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# 型チェック
npm run typecheck
```

## 注意事項
- 画像はVercel Blobに保存
- 自動で営業中/休業中を判定（曜日と時間から）
- フッターのマージンは電話ボタンの有無で調整
- SEO対策実装済み（meta tags, OGP, sitemap, robots.txt）
- MongoDBはparent_site_adminデータベースを使用（oyafukou_dbは廃止）
- LINE webhookは`/api/line-webhook`で受信
- MongoDB型エラー対策: eslint.config.mjsで`@typescript-eslint/no-explicit-any`をoff
- 環境変数：
  - `MONGODB_URI` - MongoDB接続文字列
  - `BLOB_READ_WRITE_TOKEN` - Vercel Blob用トークン
  - `LINE_CHANNEL_ACCESS_TOKEN` - LINE Bot用アクセストークン
  - `LINE_CHANNEL_SECRET` - LINE Bot用シークレット
  - `SLACK_WEBHOOK_URL` - Slack通知用WebhookURL

## デプロイ
- GitHub: https://github.com/Opi-jp/oyafukou_web
- Vercel: 自動デプロイ設定済み（mainブランチへのpushで自動デプロイ）
- URL: https://oyafukou-web.vercel.app

## 最近の更新（2025年1月）
- ハンバーガーメニュー実装（ホーム｜アクセス｜各店舗）
- 各店舗はドロップダウンで全店舗リスト表示
- 全ページ共通のHeaderコンポーネント使用
- LINE Bot連携機能実装
  - 店長がLINEでメッセージを送信すると自動的にコメント更新
  - QRコード生成機能
  - LINE連携管理画面（`/admin/line-managers`）
- Slack通知機能実装
  - 店舗情報更新時に自動通知
  - LINE経由の更新も通知
- データベース統合（oyafukou_db → parent_site_admin）
- 管理画面の完全モバイル対応
  - レスポンシブテーブル
  - タブナビゲーションのスクロール対応
  - ImageUploadコンポーネントのモバイル最適化
- **スタッフコメント機能実装（新規）**
  - 複数スタッフ対応（店長/マネージャー/スタッフ/アルバイト）
  - LINE Bot統合（友だち追加→店舗選択→役職選択の自動フロー）
  - コメント履歴管理機能
  - 表示側で役職に応じた「○○からの一言」表示
  - 承認不要で即時公開

## LINE連携の流れ（旧システム - 店長のみ）
1. 管理画面で店舗編集ページを開く
2. 「店長情報」タブでQRコードを生成
3. 店長がQRコードをスキャンしてLINE友だち追加
4. 店長が「登録」とメッセージを送信
5. 返信されたユーザーIDを管理画面に入力
6. 「LINE連携を有効にする」にチェックして保存
7. 以降、店長がLINEでメッセージを送ると自動的にコメント更新

## トラブルシューティング
### QRコードが反応しない場合
1. LINE Developers ConsoleでWebhook URLが正しく設定されているか確認
   - Webhook URL: `https://oyafukou-web.vercel.app/api/line-webhook`
2. Vercelの環境変数が正しく設定されているか確認
   - LINE_CHANNEL_ACCESS_TOKEN
   - LINE_CHANNEL_SECRET
3. `/api/debug-line`エンドポイントで診断情報を確認（未実装）

## 作業継続方法
VSCodeを閉じた後も、以下の方法で作業を継続できます：
```bash
# プロジェクトディレクトリに移動
cd /Users/yukio/oyafukou-web

# Claude Codeを起動
claude
```
このファイル（CLAUDE.md）が自動的に読み込まれ、プロジェクトの状態が把握されます。