'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  storeId?: string;
  storeName?: string;
  isActive: boolean;
  accountType: 'official' | 'store';
  lastUsed?: Date;
}

export default function TwitterAccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    twitterHandle: '',
    displayName: '',
    accessToken: '',
    accessTokenSecret: '',
    accountType: 'store' as 'official' | 'store',
    storeId: ''
  });
  const [stores, setStores] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    fetchAccounts();
    fetchStores();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/twitter-accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error('アカウント取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error('店舗取得エラー:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/twitter-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('登録に失敗しました');
      
      await fetchAccounts();
      setShowAddForm(false);
      setFormData({
        twitterHandle: '',
        displayName: '',
        accessToken: '',
        accessTokenSecret: '',
        accountType: 'store',
        storeId: ''
      });
      alert('アカウントを登録しました');
    } catch (error) {
      console.error('Error:', error);
      alert('登録に失敗しました');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/twitter-accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      await fetchAccounts();
    } catch (error) {
      console.error('Error:', error);
      alert('更新に失敗しました');
    }
  };

  const deleteAccount = async (id: string, handle: string) => {
    if (!confirm(`@${handle} を削除しますか？`)) return;
    
    try {
      const res = await fetch(`/api/twitter-accounts/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('削除に失敗しました');
      await fetchAccounts();
    } catch (error) {
      console.error('Error:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">X(Twitter)アカウント管理</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                アカウント追加
              </button>
              <Link
                href="/admin"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                管理画面へ
              </Link>
            </div>
          </div>

          {/* アカウント追加フォーム */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">新規アカウント登録</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Xハンドル名 *</label>
                    <input
                      type="text"
                      value={formData.twitterHandle}
                      onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@なしで入力 (例: oyafukou_street)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">表示名 *</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="八丈島親不孝通り公式"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">アカウントタイプ *</label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'official' | 'store' })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="official">統合アカウント</option>
                      <option value="store">店舗アカウント</option>
                    </select>
                  </div>
                  {formData.accountType === 'store' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">関連店舗</label>
                      <select
                        value={formData.storeId}
                        onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        {stores.map(store => (
                          <option key={store._id} value={store._id}>{store.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Access Token *</label>
                    <input
                      type="text"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      className="w-full px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Access Token Secret *</label>
                    <input
                      type="text"
                      value={formData.accessTokenSecret}
                      onChange={(e) => setFormData({ ...formData, accessTokenSecret: e.target.value })}
                      className="w-full px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    登録
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* アカウント一覧 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">登録済みアカウント</h2>
            
            {loading ? (
              <p>読み込み中...</p>
            ) : accounts.length === 0 ? (
              <p className="text-gray-500">アカウントが登録されていません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ハンドル名</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">表示名</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">タイプ</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">関連店舗</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">状態</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accounts.map(account => (
                      <tr key={account._id}>
                        <td className="px-4 py-2 text-sm">@{account.twitterHandle}</td>
                        <td className="px-4 py-2 text-sm">{account.displayName}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded ${
                            account.accountType === 'official' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {account.accountType === 'official' ? '統合' : '店舗'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{account.storeName || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => toggleActive(account._id, account.isActive)}
                            className={`px-2 py-1 text-xs rounded ${
                              account.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {account.isActive ? '有効' : '無効'}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => deleteAccount(account._id, account.twitterHandle)}
                            className="text-red-600 hover:underline"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 設定方法 */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">トークン取得方法</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Twitter Developer Portalにアクセス</li>
              <li>アプリケーションを作成（User authentication set upを有効化）</li>
              <li>OAuth 1.0aの設定でRead and writeを選択</li>
              <li>Access Token & Secretを生成</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}