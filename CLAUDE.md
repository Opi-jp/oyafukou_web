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

## 管理画面の仕様
- パス: `/admin`
- 認証: 現在は未実装（ユーザーの要望により後回し）
- 機能: 店舗の追加/編集/削除、画像アップロード

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
  
  // その他
  managerName?: string;
  managerComment?: string;
  temporaryClosed?: boolean;
  temporaryClosedReason?: string;
}
```

## レイアウト順序（店舗詳細ページ）
1. 詳細画像1（detailImage1）
2. 店舗基本情報（名前、カテゴリー、営業時間）
3. マネージャーコメント（写真付き吹き出し）
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

## デプロイ
- GitHub: https://github.com/Opi-jp/oyafukou_web
- Vercel: 自動デプロイ設定済み（mainブランチへのpushで自動デプロイ）
- URL: https://oyafukou-web.vercel.app

## 最近の更新
- ハンバーガーメニュー実装（ホーム｜アクセス｜各店舗）
- 各店舗はドロップダウンで全店舗リスト表示
- 全ページ共通のHeaderコンポーネント使用