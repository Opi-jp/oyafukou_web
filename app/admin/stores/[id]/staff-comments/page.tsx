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
  phone?: string;
  email?: string;
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
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

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

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      phone: staff.phone || '',
      email: staff.email || ''
    });
  };

  const handleUpdateStaffInfo = async () => {
    if (!editingStaff) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType: 'updateStaffInfo',
          lineUserId: editingStaff.lineUserId,
          staffData: {
            name: editForm.name,
            phone: editForm.phone,
            email: editForm.email
          }
        })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      await fetchStore();
      setEditingStaff(null);
      alert('スタッフ情報を更新しました');
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
                      <div className="flex items-start space-x-4 flex-1">
                        {staff.photo && (
                          <img
                            src={staff.photo}
                            alt={staff.name}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{staff.name}</h3>
                            {staff.isTemporary && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                仮登録
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{staff.role}</p>
                          
                          {/* 詳細情報 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">LINE ID:</span>
                              <span className="ml-2 text-gray-700 font-mono text-xs">{staff.lineUserId}</span>
                            </div>
                            {staff.phone && (
                              <div>
                                <span className="text-gray-500">電話:</span>
                                <span className="ml-2 text-gray-700">{staff.phone}</span>
                              </div>
                            )}
                            {staff.email && (
                              <div>
                                <span className="text-gray-500">メール:</span>
                                <span className="ml-2 text-gray-700">{staff.email}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">登録日:</span>
                              <span className="ml-2 text-gray-700">{new Date(staff.addedAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">ステータス:</span>
                              <span className={`ml-2 ${staff.isActive && !staff.isTemporary ? 'text-green-600' : 'text-gray-600'}`}>
                                {staff.isActive && !staff.isTemporary ? 'アクティブ' : staff.isTemporary ? '仮登録' : '非アクティブ'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {staff.isTemporary ? (
                          <Link
                            href={`/admin/stores/${storeId}/staff-register?lineUserId=${staff.lineUserId}&role=${encodeURIComponent(staff.role)}`}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 whitespace-nowrap"
                          >
                            本登録を完了
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="text-sm text-blue-600 hover:underline"
                              disabled={updating}
                            >
                              編集
                            </button>
                            {staff.isActive && (
                              <button
                                className="text-sm text-gray-600 hover:text-red-600"
                                disabled={updating}
                                onClick={() => {/* 非アクティブ化処理 */}}
                              >
                                無効化
                              </button>
                            )}
                          </>
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

      {/* 編集モーダル */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900">スタッフ情報を編集</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">名前</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="山田 太郎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">電話番号</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="090-1234-5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">メールアドレス</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>役職：</strong>{editingStaff.role}<br />
                  <strong>LINE ID：</strong><span className="font-mono text-xs">{editingStaff.lineUserId}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateStaffInfo}
                disabled={updating || !editForm.name}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updating ? '更新中...' : '更新'}
              </button>
              <button
                onClick={() => setEditingStaff(null)}
                disabled={updating}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}