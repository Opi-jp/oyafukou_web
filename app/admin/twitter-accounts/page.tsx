'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function TwitterAccountsContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<'official' | 'store'>('store');
  const [stores, setStores] = useState<Array<{ _id: string; name: string }>>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchStores();
    
    // URLパラメータからメッセージを表示
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'true') {
      setMessage({ type: 'success', text: 'Xアカウントを連携しました！' });
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        auth_failed: '認証に失敗しました',
        missing_params: 'パラメータが不足しています',
        token_mismatch: 'トークンが一致しません',
        login_failed: 'ログインに失敗しました',
        callback_failed: 'コールバック処理に失敗しました'
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'エラーが発生しました' 
      });
    }
    
    // メッセージを5秒後に消す
    if (success || error) {
      setTimeout(() => setMessage(null), 5000);
    }
  }, [searchParams]);

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

  const handleTwitterAuth = () => {
    const params = new URLSearchParams({
      type: selectedAccountType
    });
    
    if (selectedAccountType === 'store' && selectedStoreId) {
      params.append('storeId', selectedStoreId);
    }
    
    window.location.href = `/api/auth/twitter?${params.toString()}`;
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
              <Link
                href="/admin/social-posts"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                投稿管理
              </Link>
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

          {/* メッセージ表示 */}
          {message && (
            <div className={`mb-4 p-4 rounded ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* アカウント追加フォーム */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">新規アカウント連携</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">アカウントタイプ</label>
                  <select
                    value={selectedAccountType}
                    onChange={(e) => setSelectedAccountType(e.target.value as 'official' | 'store')}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="official">統合アカウント</option>
                    <option value="store">店舗アカウント</option>
                  </select>
                </div>
                
                {selectedAccountType === 'store' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">関連店舗</label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="pt-4">
                  <button
                    onClick={handleTwitterAuth}
                    disabled={selectedAccountType === 'store' && !selectedStoreId}
                    className="w-full bg-blue-400 text-white py-3 rounded-lg hover:bg-blue-500 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Xアカウントと連携
                  </button>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedStoreId('');
                      setSelectedAccountType('store');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
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
            <h3 className="font-semibold text-blue-900 mb-2">X(Twitter)連携の設定方法</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>「アカウント追加」ボタンをクリック</li>
              <li>アカウントタイプを選択（統合または店舗）</li>
              <li>店舗アカウントの場合は関連店舗を選択</li>
              <li>「Xアカウントと連携」ボタンをクリック</li>
              <li>X(Twitter)にログインして連携を許可</li>
            </ol>
            <p className="text-sm text-blue-700 mt-3">
              ※事前にTwitter Developer Portalでアプリケーションの設定が必要です
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TwitterAccountsPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">読み込み中...</div>
          </div>
        </div>
      </>
    }>
      <TwitterAccountsContent />
    </Suspense>
  );
}