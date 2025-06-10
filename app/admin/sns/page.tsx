'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  storeId?: string;
  storeName?: string;
  isActive: boolean;
  addedAt: Date;
}

interface PostLog {
  _id: string;
  textList: string[];
  mediaType: string;
  mediaPath?: string;
  sourceAccount: string;
  storeId?: string;
  createdAt: Date;
}

export default function AdminSNSPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Xアカウント一覧を取得
      const accountsRes = await fetch('/api/twitter-accounts');
      const accountsData = await accountsRes.json();
      setAccounts(accountsData);

      // 最近の投稿履歴を取得
      const postsRes = await fetch('/api/post-log?limit=10');
      const postsData = await postsRes.json();
      setRecentPosts(postsData);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">SNS投稿管理</h1>
          <Link href="/admin" className="text-blue-400 hover:underline">
            ← 管理画面に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* メインメニュー */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/sns/broadcast" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-blue-600 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">一斉投稿</h2>
            <p className="text-gray-600 text-sm">
              複数のアカウントに同時投稿
              予約投稿も可能
            </p>
          </Link>

          <Link href="/admin/sns/accounts" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-green-600 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">アカウント管理</h2>
            <p className="text-gray-600 text-sm">
              X(Twitter)アカウントの追加・管理
              OAuth連携設定
            </p>
          </Link>

          <Link href="/admin/sns/history" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-purple-600 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">投稿履歴</h2>
            <p className="text-gray-600 text-sm">
              過去の投稿を確認
              再利用も可能
            </p>
          </Link>
        </div>

        {/* 登録済みアカウント一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">登録済みXアカウント</h2>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account._id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">@{account.twitterHandle}</p>
                    <p className="text-sm text-gray-600">{account.displayName}</p>
                    {account.storeName && (
                      <p className="text-xs text-gray-500">店舗: {account.storeName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {account.storeId && (
                      <Link
                        href={`/stores/${account.storeId}/post`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        投稿画面
                      </Link>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.isActive ? '有効' : '無効'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">アカウントが登録されていません</p>
          )}
        </div>

        {/* 最近の投稿 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">最近の投稿</h2>
          {recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post._id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium">{post.sourceAccount}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {post.textList[0]}
                  </p>
                  {post.textList.length > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{post.textList.length - 1}件のツイート
                    </p>
                  )}
                  {post.mediaType !== 'none' && (
                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {post.mediaType === 'image' ? '画像' : '動画'}付き
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">投稿履歴がありません</p>
          )}
        </div>
      </main>
    </div>
  );
}