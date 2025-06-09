'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface StaffComment {
  _id?: string;
  staffLineUserId: string;
  staffName: string;
  staffRole: string;
  staffPhoto?: string;
  comment: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface Store {
  _id: string;
  name: string;
  staffComments: StaffComment[];
  activeStaffComment?: StaffComment;
}

export default function StaffCommentsHistoryPage() {
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStore(params.id as string);
    }
  }, [params.id]);

  const fetchStore = async (id: string) => {
    try {
      const response = await fetch(`/api/stores/${id}`);
      const data = await response.json();
      setStore(data);
    } catch (error) {
      console.error('店舗データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveComment = async (comment: StaffComment) => {
    if (!store) return;

    try {
      const updatedStore = {
        ...store,
        activeStaffComment: {
          ...comment,
          updatedAt: new Date()
        }
      };

      const response = await fetch(`/api/stores/${store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStore),
      });

      if (response.ok) {
        alert('表示コメントを変更しました');
        fetchStore(store._id);
      }
    } catch (error) {
      console.error('変更に失敗しました:', error);
      alert('変更に失敗しました');
    }
  };

  const deleteComment = async (commentIndex: number) => {
    if (!store || !confirm('このコメントを削除しますか？')) return;

    try {
      const updatedComments = store.staffComments.filter((_, i) => i !== commentIndex);
      const updatedStore = {
        ...store,
        staffComments: updatedComments
      };

      const response = await fetch(`/api/stores/${store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStore),
      });

      if (response.ok) {
        alert('コメントを削除しました');
        fetchStore(store._id);
      }
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">読み込み中...</div>;
  if (!store) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">店舗が見つかりません</div>;

  const sortedComments = [...(store.staffComments || [])].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">スタッフコメント履歴: {store.name}</h1>
          <Link href={`/admin/stores/${store._id}`} className="text-blue-400 hover:underline text-sm sm:text-base">
            ← 店舗編集に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* 現在のアクティブコメント */}
        {store.activeStaffComment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">現在表示中のコメント</h2>
            <div className="bg-green-50 p-4 rounded">
              <div className="flex items-start gap-4">
                {store.activeStaffComment.staffPhoto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={store.activeStaffComment.staffPhoto} 
                    alt={store.activeStaffComment.staffName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold">
                    {store.activeStaffComment.staffName}
                    <span className="text-sm text-gray-600 ml-2">({store.activeStaffComment.staffRole})</span>
                  </p>
                  <p className="mt-2">{store.activeStaffComment.comment}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    更新日: {store.activeStaffComment.updatedAt ? 
                      new Date(store.activeStaffComment.updatedAt).toLocaleDateString('ja-JP') : 
                      '不明'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* コメント履歴 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            コメント履歴
            {sortedComments.length > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                （全{sortedComments.length}件）
              </span>
            )}
          </h2>
          
          {sortedComments.length === 0 ? (
            <p className="text-gray-500">コメントがありません</p>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment, index) => {
                const isActive = store.activeStaffComment && 
                  store.activeStaffComment.staffLineUserId === comment.staffLineUserId &&
                  store.activeStaffComment.comment === comment.comment;
                
                return (
                  <div key={index} className={`border rounded p-4 ${isActive ? 'border-green-500 bg-green-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold">
                          {comment.staffName}
                          <span className="text-sm text-gray-600 ml-2">({comment.staffRole})</span>
                          {isActive && (
                            <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                              表示中
                            </span>
                          )}
                        </p>
                        <p className="mt-2">{comment.comment}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          投稿日: {new Date(comment.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!isActive && (
                          <button
                            onClick={() => setActiveComment(comment)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            表示する
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(index)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 使い方の説明 */}
        <div className="mt-6 bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">💡 使い方</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>スタッフがLINEで送信したコメントが自動的にここに追加されます</li>
            <li>「表示する」ボタンで、そのコメントをウェブサイトに表示できます</li>
            <li>最新のコメントが自動的に表示されますが、過去のコメントに切り替えることも可能です</li>
          </ul>
        </div>
      </main>
    </div>
  );
}