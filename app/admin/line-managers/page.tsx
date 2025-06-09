'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Store {
  _id: string;
  name: string;
}

interface Manager {
  _id?: string;
  lineUserId: string;
  storeId: string;
  managerName: string;
  isActive: boolean;
  createdAt?: Date;
}

export default function LineManagersPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Manager>({
    lineUserId: '',
    storeId: '',
    managerName: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 店舗一覧を取得
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData);

      // マネージャー一覧を取得
      const managersRes = await fetch('/api/line-managers');
      const managersData = await managersRes.json();
      setManagers(managersData);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/line-managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('LINE連携を追加しました');
        setShowAddForm(false);
        setFormData({
          lineUserId: '',
          storeId: '',
          managerName: '',
          isActive: true
        });
        fetchData();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.message}`);
      }
    } catch (error) {
      console.error('追加に失敗しました:', error);
      alert('追加に失敗しました');
    }
  };

  const handleDelete = async (id: string, managerName: string) => {
    if (!confirm(`本当に「${managerName}」のLINE連携を削除しますか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/line-managers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('LINE連携を削除しました');
        fetchData();
      }
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/line-managers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('更新に失敗しました:', error);
    }
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    return store ? store.name : '不明な店舗';
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 text-gray-900 pt-16">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/admin" className="text-blue-600 hover:underline">
              ← 管理画面に戻る
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">LINE連携管理</h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {showAddForm ? '閉じる' : '新規追加'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-semibold mb-4">新規LINE連携追加</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">LINEユーザーID *</label>
                    <input
                      type="text"
                      value={formData.lineUserId}
                      onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                      required
                      placeholder="U1234567890abcdef..."
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      LINE Developersで確認できるユーザーID
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">店舗 *</label>
                    <select
                      value={formData.storeId}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">マネージャー名 *</label>
                    <input
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      required
                      placeholder="山田太郎"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">有効</span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  追加
                </button>
              </form>
            )}

            {loading ? (
              <p className="text-center py-4">読み込み中...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">マネージャー名</th>
                      <th className="px-4 py-2 text-left">店舗</th>
                      <th className="px-4 py-2 text-left">LINEユーザーID</th>
                      <th className="px-4 py-2 text-left">状態</th>
                      <th className="px-4 py-2 text-left">登録日</th>
                      <th className="px-4 py-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map(manager => (
                      <tr key={manager._id} className="border-b">
                        <td className="px-4 py-2 font-semibold">{manager.managerName}</td>
                        <td className="px-4 py-2">{getStoreName(manager.storeId)}</td>
                        <td className="px-4 py-2 font-mono text-xs">{manager.lineUserId}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => toggleActive(manager._id!, manager.isActive)}
                            className={`px-2 py-1 rounded text-sm ${
                              manager.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {manager.isActive ? '有効' : '無効'}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {manager.createdAt
                            ? new Date(manager.createdAt).toLocaleDateString('ja-JP')
                            : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDelete(manager._id!, manager.managerName)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {managers.length === 0 && (
                  <p className="text-center py-4 text-gray-500">
                    LINE連携が登録されていません。
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">使い方</h3>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>LINE DevelopersでチャンネルのWebhook URLを設定</li>
                <li>店長のLINEユーザーIDを取得して登録</li>
                <li>店長がLINEでメッセージを送ると自動的にコメントが更新されます</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}