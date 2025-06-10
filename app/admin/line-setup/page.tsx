'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function LineSetupPage() {
  const [showInstructions, setShowInstructions] = useState(false);
  const lineAddUrl = 'https://line.me/R/ti/p/@577lunkr';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">LINE Bot 設定</h1>
          <Link href="/admin" className="text-blue-400 hover:underline text-sm sm:text-base">
            ← 管理画面に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">共通QRコード</h2>
          
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
              <QRCodeSVG value={lineAddUrl} size={256} level="H" />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              店長・マネージャー用LINE Bot登録QRコード
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">登録の流れ</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>店長・マネージャーに上記QRコードを読み取ってもらう</li>
                <li>LINE友だち追加後、自動で店舗選択メニューが表示される</li>
                <li>自分の店舗を選択すると自動登録完了</li>
                <li>以降、テキストや画像を送るだけで更新可能</li>
              </ol>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                {showInstructions ? '詳細を隠す' : '詳細な使い方を表示'}
              </button>
              
              {showInstructions && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">初回登録</h4>
                    <p className="text-sm text-gray-600">
                      QRコードを読み取り → 友だち追加 → 店舗選択メニューから自分の店舗をタップ
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">更新方法</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>テキストメッセージ: 店長コメントを更新</li>
                      <li>画像: マネージャー写真を更新</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">再登録が必要な場合</h4>
                    <p className="text-sm text-gray-600">
                      「登録」とメッセージを送ると、店舗選択メニューが再表示されます
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>注意:</strong> 1人1店舗のみ登録可能です。複数店舗を管理する場合は別のLINEアカウントが必要です。
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">関連リンク</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/line-managers"
                  className="block text-blue-600 hover:underline"
                >
                  → LINE連携状況を確認
                </Link>
                <Link
                  href="/admin"
                  className="block text-blue-600 hover:underline"
                >
                  → 店舗管理画面へ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}