'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  storeId?: string;
  storeName?: string;
  isActive: boolean;
  addedAt: Date;
  lastUsed?: Date;
}

interface Store {
  _id: string;
  name: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<TwitterAccount | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // アカウント一覧を取得
      const accountsRes = await fetch('/api/twitter-accounts');
      const accountsData = await accountsRes.json();
      setAccounts(accountsData);

      // 店舗一覧を取得
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (account: TwitterAccount) => {
    try {
      const res = await fetch(`/api/twitter-accounts/${account._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('更新エラー:', error);
    }
  };

  const handleUpdateStore = async () => {
    if (!editingAccount) return;

    try {
      const res = await fetch(`/api/twitter-accounts/${editingAccount._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storeId: editingAccount.storeId || null,
          storeName: editingAccount.storeId 
            ? stores.find(s => s._id === editingAccount.storeId)?.name 
            : null
        })
      });

      if (res.ok) {
        setEditingAccount(null);
        fetchData();
      }
    } catch (error) {
      console.error('更新エラー:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('このアカウントを削除してもよろしいですか？')) return;

    try {
      const res = await fetch(`/api/twitter-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('削除エラー:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Xアカウント管理</h1>
          <Link href="/admin/sns" className="text-blue-400 hover:underline">
            ← SNS管理に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* 新規アカウント追加 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">新規アカウント追加</h2>
          <p className="text-gray-600 mb-4">
            X(Twitter)アカウントを追加するには、以下のボタンから認証を行ってください。
          </p>
          <a
            href="/api/auth/twitter"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Xアカウントを追加
          </a>
        </div>

        {/* 登録済みアカウント一覧 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">登録済みアカウント</h2>
          </div>
          
          {accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アカウント
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      表示名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      紐付け店舗
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          @{account.twitterHandle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {account.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount?._id === account._id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editingAccount.storeId || ''}
                              onChange={(e) => setEditingAccount({
                                ...editingAccount,
                                storeId: e.target.value
                              })}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="">未設定</option>
                              {stores.map((store) => (
                                <option key={store._id} value={store._id}>
                                  {store.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleUpdateStore}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingAccount(null)}
                              className="text-gray-600 hover:underline text-sm"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {account.storeName || '未設定'}
                            </span>
                            <button
                              onClick={() => setEditingAccount(account)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              編集
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(account)}
                          className={`px-2 py-1 rounded text-xs cursor-pointer ${
                            account.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {account.isActive ? '有効' : '無効'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(account.addedAt).toLocaleDateString('ja-JP')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {account.storeId && (
                            <Link
                              href={`/stores/${account.storeId}/post`}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              投稿
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(account._id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              アカウントが登録されていません
            </div>
          )}
        </div>

        {/* 使用方法 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">使用方法</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 「Xアカウントを追加」ボタンからX(Twitter)の認証を行います</li>
            <li>• 認証完了後、自動的にアカウントが登録されます</li>
            <li>• 店舗に紐付けることで、店舗スタッフからの投稿が可能になります</li>
            <li>• 複数のアカウントを登録して一斉投稿も可能です</li>
          </ul>
        </div>
      </main>
    </div>
  );
}