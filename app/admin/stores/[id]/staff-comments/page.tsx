'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Store {
  _id: string;
  name: string;
  staffMembers?: StaffMember[];
  staffComments?: StaffComment[];
  activeStaffComment?: ActiveComment;
}

interface StaffMember {
  lineUserId: string;
  name: string;
  role: string;
  photo?: string;
  isActive: boolean;
  isTemporary?: boolean;
  addedAt: Date;
}

interface StaffComment {
  _id?: string;
  staffLineUserId: string;
  staffName: string;
  staffRole: string;
  staffPhoto?: string;
  comment: string;
  isActive: boolean;
  createdAt: Date;
}

interface ActiveComment {
  staffLineUserId: string;
  staffName: string;
  staffRole: string;
  staffPhoto?: string;
  comment: string;
  updatedAt: Date;
}

export default function StaffCommentsPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}`);
      if (!res.ok) throw new Error('店舗が見つかりません');
      const data = await res.json();
      setStore(data);
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveComment = async (comment: StaffComment) => {
    if (!confirm('このコメントを表示しますか？')) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeStaffComment: {
            staffLineUserId: comment.staffLineUserId,
            staffName: comment.staffName,
            staffRole: comment.staffRole,
            staffPhoto: comment.staffPhoto,
            comment: comment.comment,
            updatedAt: new Date()
          }
        })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      await fetchStore();
      alert('コメントを更新しました');
    } catch (error) {
      console.error('Error:', error);
      alert('更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStaffName = async (lineUserId: string, newName: string) => {
    const name = prompt('新しい名前を入力してください', newName);
    if (!name || name === newName) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType: 'updateStaffName',
          lineUserId,
          name
        })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      await fetchStore();
      alert('名前を更新しました');
    } catch (error) {
      console.error('Error:', error);
      alert('更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
          <p>読み込み中...</p>
        </div>
      </>
    );
  }

  if (!store) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
          <p>店舗が見つかりません</p>
        </div>
      </>
    );
  }

  const sortedComments = [...(store.staffComments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 text-gray-900 pt-16">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="mb-6">
            <Link href={`/admin/stores/${storeId}`} className="text-blue-600 hover:underline">
              ← 店舗編集に戻る
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-6">{store.name} - スタッフ管理</h1>

          {/* スタッフ一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">登録スタッフ</h2>
            
            {!store.staffMembers || store.staffMembers.length === 0 ? (
              <p className="text-gray-500">スタッフが登録されていません</p>
            ) : (
              <div className="space-y-4">
                {store.staffMembers.map((staff) => (
                  <div key={staff.lineUserId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        {staff.photo && (
                          <img
                            src={staff.photo}
                            alt={staff.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{staff.name}</h3>
                            {staff.isTemporary && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                仮登録
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{staff.role}</p>
                          <p className="text-xs text-gray-500">
                            登録日: {new Date(staff.addedAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {staff.isTemporary ? (
                          <Link
                            href={`/admin/stores/${storeId}/staff-register?lineUserId=${staff.lineUserId}&role=${encodeURIComponent(staff.role)}`}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            本登録を完了
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleUpdateStaffName(staff.lineUserId, staff.name)}
                            className="text-sm text-blue-600 hover:underline"
                            disabled={updating}
                          >
                            名前を編集
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 現在表示中のコメント */}
          {store.activeStaffComment && (
            <div className="bg-green-50 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-green-900">現在表示中のコメント</h2>
              <div className="flex items-start space-x-4">
                {store.activeStaffComment.staffPhoto && (
                  <img
                    src={store.activeStaffComment.staffPhoto}
                    alt={store.activeStaffComment.staffName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">
                    {store.activeStaffComment.staffName}（{store.activeStaffComment.staffRole}）
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap">{store.activeStaffComment.comment}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    更新日時: {new Date(store.activeStaffComment.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* コメント履歴 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">コメント履歴</h2>
            
            {sortedComments.length === 0 ? (
              <p className="text-gray-500">コメントがありません</p>
            ) : (
              <div className="space-y-4">
                {sortedComments.map((comment, index) => {
                  const isActive = store.activeStaffComment?.comment === comment.comment &&
                                 store.activeStaffComment?.staffLineUserId === comment.staffLineUserId;
                  
                  return (
                    <div
                      key={`${comment.staffLineUserId}-${index}`}
                      className={`border rounded-lg p-4 ${isActive ? 'border-green-500 bg-green-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {comment.staffPhoto && (
                            <img
                              src={comment.staffPhoto}
                              alt={comment.staffName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {comment.staffName}（{comment.staffRole}）
                            </h3>
                            <p className="mt-1 whitespace-pre-wrap">{comment.comment}</p>
                            <p className="text-sm text-gray-600 mt-2">
                              {new Date(comment.createdAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        
                        {!isActive && (
                          <button
                            onClick={() => handleSetActiveComment(comment)}
                            className="ml-4 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            disabled={updating}
                          >
                            表示
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}