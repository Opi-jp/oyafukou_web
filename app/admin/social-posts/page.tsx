'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface ScheduledPost {
  _id: string;
  textList: string[];
  mediaType: 'image' | 'video' | 'none';
  accountIds: string[];
  accounts?: Array<{ twitterHandle: string; displayName: string }>;
  scheduledAt: Date;
  status: 'pending' | 'posted' | 'failed';
  broadcast: boolean;
  source: string;
  createdBy: string;
  createdAt: Date;
  error?: string;
}

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'posted' | 'failed'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social-posts');
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('投稿取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelPost = async (id: string) => {
    if (!confirm('この投稿をキャンセルしますか？')) return;
    
    try {
      const res = await fetch(`/api/social-posts/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('キャンセルに失敗しました');
      await fetchPosts();
    } catch (error) {
      console.error('Error:', error);
      alert('キャンセルに失敗しました');
    }
  };

  const retryPost = async (id: string) => {
    if (!confirm('この投稿を再試行しますか？')) return;
    
    try {
      const res = await fetch(`/api/social-posts/${id}/retry`, {
        method: 'POST'
      });
      
      if (!res.ok) throw new Error('再試行に失敗しました');
      await fetchPosts();
      alert('投稿を再試行しました');
    } catch (error) {
      console.error('Error:', error);
      alert('再試行に失敗しました');
    }
  };

  const filteredPosts = posts.filter(post => 
    filter === 'all' || post.status === filter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">予約中</span>;
      case 'posted':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">投稿済</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">失敗</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">投稿管理</h1>
            <div className="flex gap-2">
              <Link
                href="/admin/social-posts/new"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                新規投稿
              </Link>
              <Link
                href="/admin"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                管理画面へ
              </Link>
            </div>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'posted', 'failed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded ${
                    filter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' && '全て'}
                  {status === 'pending' && '予約中'}
                  {status === 'posted' && '投稿済'}
                  {status === 'failed' && '失敗'}
                  {status !== 'all' && ` (${posts.filter(p => p.status === status).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* 投稿一覧 */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-6 text-center">読み込み中...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                投稿がありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPosts.map(post => (
                  <div key={post._id} className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                        {post.broadcast && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            一斉投稿
                          </span>
                        )}
                        {post.mediaType !== 'none' && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {post.mediaType === 'image' ? '画像' : '動画'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleString('ja-JP')}
                      </div>
                    </div>

                    {/* 投稿内容 */}
                    <div className="mb-3">
                      {post.textList.map((text, index) => (
                        <div key={index} className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">
                            {index === 0 ? '1つ目' : `${index + 1}つ目（返信）`}:
                          </div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">
                            {text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 投稿先 */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">投稿先:</div>
                      <div className="text-sm text-gray-700">
                        {post.accounts?.map(acc => `@${acc.twitterHandle}`).join(', ') || 
                         `${post.accountIds.length}アカウント`}
                      </div>
                    </div>

                    {/* 予定日時 */}
                    {post.status === 'pending' && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">予定日時:</div>
                        <div className="text-sm text-gray-700">
                          {new Date(post.scheduledAt).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    )}

                    {/* エラー表示 */}
                    {post.error && (
                      <div className="mb-3 p-2 bg-red-50 rounded">
                        <div className="text-xs text-red-600">エラー: {post.error}</div>
                      </div>
                    )}

                    {/* アクション */}
                    <div className="flex gap-2">
                      {post.status === 'pending' && (
                        <button
                          onClick={() => cancelPost(post._id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          キャンセル
                        </button>
                      )}
                      {post.status === 'failed' && (
                        <button
                          onClick={() => retryPost(post._id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          再試行
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}