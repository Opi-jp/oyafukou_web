'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostLog {
  _id: string;
  textList: string[];
  mediaType: string;
  mediaPath?: string;
  sourceAccount: string;
  storeId?: string;
  createdAt: Date;
}

interface ScheduledPost {
  _id: string;
  textList: string[];
  accountIds: string[];
  scheduledAt: Date;
  status: string;
  broadcast: boolean;
  createdBy: string;
  mediaPath?: string;
  mediaType: string;
}

export default function HistoryPage() {
  const [postLogs, setPostLogs] = useState<PostLog[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posted' | 'scheduled'>('posted');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 投稿履歴を取得
      const logsRes = await fetch('/api/post-log');
      const logsData = await logsRes.json();
      setPostLogs(logsData);

      // 予約投稿を取得
      const scheduledRes = await fetch('/api/social-posts?status=pending');
      const scheduledData = await scheduledRes.json();
      setScheduledPosts(scheduledData);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScheduled = async (postId: string) => {
    if (!confirm('この予約投稿をキャンセルしますか？')) return;

    try {
      const res = await fetch(`/api/social-posts/${postId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('キャンセルエラー:', error);
    }
  };

  const handleReuse = (textList: string[]) => {
    // テキストをローカルストレージに保存して投稿画面へ
    localStorage.setItem('reusePost', JSON.stringify({ textList }));
    window.location.href = '/admin/sns/broadcast';
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
          <h1 className="text-2xl font-bold">投稿履歴</h1>
          <Link href="/admin/sns" className="text-blue-400 hover:underline">
            ← SNS管理に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* タブ */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('posted')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'posted'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              投稿済み
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              予約投稿
            </button>
          </div>

          {/* 投稿済みタブ */}
          {activeTab === 'posted' && (
            <div className="p-6">
              {postLogs.length > 0 ? (
                <div className="space-y-4">
                  {postLogs.map((log) => (
                    <div key={log._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{log.sourceAccount}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleReuse(log.textList)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          再利用
                        </button>
                      </div>
                      <div className="space-y-2">
                        {log.textList.map((text, index) => (
                          <p key={index} className="text-sm text-gray-700">
                            {index > 0 && '└ '}{text}
                          </p>
                        ))}
                      </div>
                      {log.mediaType !== 'none' && (
                        <div className="mt-2">
                          {log.mediaType === 'image' && log.mediaPath && (
                            <img 
                              src={log.mediaPath} 
                              alt="投稿画像" 
                              className="h-20 rounded"
                            />
                          )}
                          {log.mediaType === 'video' && (
                            <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              動画付き
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">投稿履歴がありません</p>
              )}
            </div>
          )}

          {/* 予約投稿タブ */}
          {activeTab === 'scheduled' && (
            <div className="p-6">
              {scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            予約日時: {new Date(post.scheduledAt).toLocaleString('ja-JP')}
                          </p>
                          <p className="text-sm text-gray-500">
                            投稿先: {post.accountIds.length}アカウント
                            {post.broadcast && ' (一斉投稿)'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelScheduled(post._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          キャンセル
                        </button>
                      </div>
                      <div className="space-y-2">
                        {post.textList.map((text, index) => (
                          <p key={index} className="text-sm text-gray-700">
                            {index > 0 && '└ '}{text}
                          </p>
                        ))}
                      </div>
                      {post.mediaType !== 'none' && (
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {post.mediaType === 'image' ? '画像' : '動画'}付き
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">予約投稿がありません</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}