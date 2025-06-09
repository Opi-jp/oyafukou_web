'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Store {
  _id: string;
  name: string;
  lineUserId?: string;
  lineManagerActive?: boolean;
  managerName?: string;
}

export default function LineManagersPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error('店舗情報の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const lineEnabledStores = stores.filter(store => store.lineUserId);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">LINE連携管理</h1>
            <Link
              href="/admin"
              className="w-full sm:w-auto text-center bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              管理画面トップへ
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">LINE連携済み店舗</h2>
              
              {lineEnabledStores.length === 0 ? (
                <p className="text-gray-500">LINE連携されている店舗はありません。</p>
              ) : (
                <>
                  {/* モバイル表示 */}
                  <div className="sm:hidden space-y-4">
                    {lineEnabledStores.map((store) => (
                      <div key={store._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{store.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            store.lineManagerActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {store.lineManagerActive ? 'アクティブ' : '無効'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">マネージャー: {store.managerName || '-'}</p>
                        <p className="text-xs font-mono text-gray-500 mb-3 break-all">{store.lineUserId}</p>
                        <Link
                          href={`/admin/stores/${store._id}`}
                          className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          編集
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* デスクトップ表示 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">店舗名</th>
                          <th className="px-4 py-2 text-left">マネージャー名</th>
                          <th className="px-4 py-2 text-left">LINE ID</th>
                          <th className="px-4 py-2 text-left">ステータス</th>
                          <th className="px-4 py-2 text-left">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lineEnabledStores.map((store) => (
                          <tr key={store._id}>
                            <td className="px-4 py-2">{store.name}</td>
                            <td className="px-4 py-2">{store.managerName || '-'}</td>
                            <td className="px-4 py-2 text-xs font-mono">{store.lineUserId}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                store.lineManagerActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {store.lineManagerActive ? 'アクティブ' : '無効'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <Link
                                href={`/admin/stores/${store._id}`}
                                className="text-blue-600 hover:underline"
                              >
                                編集
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">LINE連携の設定方法</h3>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>店舗編集画面で「LINE連携」セクションを開く</li>
                  <li>マネージャーにQRコードをスキャンしてもらう</li>
                  <li>送られてきたLINE IDを店舗編集画面に入力</li>
                  <li>「LINE連携を有効にする」をチェックして保存</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}