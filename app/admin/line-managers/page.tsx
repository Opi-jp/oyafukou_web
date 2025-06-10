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
  staffMembers?: Array<{
    lineUserId: string;
    name: string;
    role: string;
    isActive: boolean;
    isTemporary?: boolean;
  }>;
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

  // 新システム（staffMembers）でLINE連携がある店舗のみ表示
  const lineEnabledStores = stores.filter(store => 
    store.staffMembers && store.staffMembers.length > 0
  );

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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">LINE連携状況</h2>
              
              {lineEnabledStores.length === 0 ? (
                <p className="text-gray-600">LINE連携されている店舗はありません。</p>
              ) : (
                <>
                  {/* モバイル表示 */}
                  <div className="sm:hidden space-y-4">
                    {lineEnabledStores.map((store) => (
                      <div key={store._id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-3">{store.name}</h3>
                        
                        {/* スタッフ一覧 */}
                        {store.staffMembers && store.staffMembers.length > 0 && (
                          <div className="space-y-2">
                            {store.staffMembers.map((staff) => (
                              <div key={staff.lineUserId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {staff.name} 
                                    <span className="text-gray-600 ml-1">({staff.role})</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {staff.isTemporary && (
                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                      仮登録
                                    </span>
                                  )}
                                  {staff.isActive && !staff.isTemporary && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                      アクティブ
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Link
                          href={`/admin/stores/${store._id}/staff-comments`}
                          className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          スタッフ管理
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* デスクトップ表示 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 font-semibold">店舗名</th>
                          <th className="px-4 py-2 text-left text-gray-700 font-semibold">スタッフ一覧</th>
                          <th className="px-4 py-2 text-left text-gray-700 font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lineEnabledStores.map((store) => (
                          <tr key={store._id}>
                            <td className="px-4 py-2 text-gray-900 font-medium">{store.name}</td>
                            <td className="px-4 py-2">
                              {store.staffMembers && store.staffMembers.length > 0 ? (
                                <div className="space-y-1">
                                  {store.staffMembers.map((staff) => (
                                    <div key={staff.lineUserId} className="flex items-center gap-2">
                                      <span className="text-gray-900">
                                        {staff.name} 
                                        <span className="text-gray-600 text-sm ml-1">({staff.role})</span>
                                      </span>
                                      {staff.isTemporary && (
                                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                          仮登録
                                        </span>
                                      )}
                                      {staff.isActive && !staff.isTemporary && (
                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                          アクティブ
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <Link
                                href={`/admin/stores/${store._id}/staff-comments`}
                                className="text-blue-600 hover:underline"
                              >
                                スタッフ管理
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
                <h3 className="font-semibold text-blue-900 mb-2">スタッフ登録の流れ</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>共通QRコード（@577lunkr）から友だち追加</li>
                  <li>表示される店舗リストから所属店舗を選択</li>
                  <li>役職（店長/マネージャー/スタッフ/アルバイト）を選択</li>
                  <li>送られたURLから本登録を完了</li>
                  <li>登録後はLINEでコメントや写真を送信可能</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}