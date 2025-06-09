'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface MenuItem {
  name: string;
  price: number;
  description: string;
  image?: string;
  isRecommended?: boolean;
}

interface CategoryMenuItem {
  name: string;
  price: number;
  category: string;
}

interface StaffMember {
  lineUserId: string;
  name: string;
  role: string;
  photo?: string;
  isActive: boolean;
  addedAt: Date;
}

interface StaffComment {
  staffLineUserId: string;
  staffName: string;
  staffRole: string;
  staffPhoto?: string;
  comment: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
}

interface Store {
  _id: string;
  name: string;
  category: string;
  description: string;
  openingHours: string;
  closedDays: string[];
  phone: string;
  address: string;
  managerName?: string;
  managerPhoto?: string;
  managerComment?: string;
  topImage?: string;
  detailImage1?: string;
  detailImage2?: string;
  exteriorImage?: string;
  images: string[];
  isOpen: boolean;
  temporaryClosed?: boolean;
  temporaryClosedReason?: string;
  menuHighlights: MenuItem[];
  regularMenu: CategoryMenuItem[];
  drinkMenu: CategoryMenuItem[];
  lineUserId?: string;
  lineManagerActive?: boolean;
  staffMembers?: StaffMember[];
  staffComments?: StaffComment[];
  activeStaffComment?: StaffComment;
}

export default function EditStore() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      // LINE IDが空文字の場合はnullに変換
      const storeData = {
        ...store,
        lineUserId: store.lineUserId || null
      };

      const response = await fetch(`/api/stores/${store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData),
      });

      if (response.ok) {
        alert('店舗情報を更新しました');
        router.push('/admin');
      }
    } catch (error) {
      console.error('店舗情報の更新に失敗しました:', error);
      alert('店舗情報の更新に失敗しました');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!store) return;
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setStore({ ...store, [name]: (e.target as HTMLInputElement).checked });
    } else if (name === 'closedDays') {
      setStore({ ...store, [name]: value.split(',').map(day => day.trim()) });
    } else {
      setStore({ ...store, [name]: value });
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">読み込み中...</div>;
  if (!store) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">店舗が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">店舗編集: {store.name}</h1>
          <Link href="/admin" className="text-blue-400 hover:underline text-sm sm:text-base">
            ← 管理画面に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          {/* タブナビゲーション - モバイル対応 */}
          <div className="flex overflow-x-auto border-b mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            {['basic', 'manager', 'images', 'menu', 'staff'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'basic' && '基本情報'}
                {tab === 'manager' && '店長情報'}
                {tab === 'images' && '画像管理'}
                {tab === 'menu' && 'メニュー管理'}
                {tab === 'staff' && 'スタッフ管理'}
              </button>
            ))}
          </div>

          {/* 基本情報タブ */}
          {activeTab === 'basic' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">店舗名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={store.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">カテゴリー *</label>
                  <input
                    type="text"
                    name="category"
                    value={store.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">説明 *</label>
                  <textarea
                    name="description"
                    value={store.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">営業時間 *</label>
                  <input
                    type="text"
                    name="openingHours"
                    value={store.openingHours}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">定休日</label>
                  <input
                    type="text"
                    name="closedDays"
                    value={store.closedDays.join(', ')}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">電話番号</label>
                  <input
                    type="text"
                    name="phone"
                    value={store.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">住所 *</label>
                  <input
                    type="text"
                    name="address"
                    value={store.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isOpen"
                      checked={store.isOpen}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">営業中</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="temporaryClosed"
                      checked={store.temporaryClosed || false}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-red-600 font-bold">臨時休業</span>
                  </label>
                </div>
                {store.temporaryClosed && (
                  <div>
                    <label className="block text-sm font-medium mb-1">臨時休業理由</label>
                    <input
                      type="text"
                      name="temporaryClosedReason"
                      value={store.temporaryClosedReason || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例：店内改装のため"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 店長情報タブ */}
          {activeTab === 'manager' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">店長情報</h2>
              
              {/* LINE連携セクション */}
              <div className="mb-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">LINE連携設定</h3>
                
                {!store.lineUserId ? (
                  <>
                    <p className="text-sm text-blue-800 mb-3">
                      店長がLINEでメッセージを送るだけで、自動的に店長コメントが更新されます。
                    </p>
                    <div className="bg-yellow-50 p-3 rounded mb-3">
                      <p className="text-sm text-yellow-800">
                        <strong>新しい登録方法:</strong><br />
                        1. <Link href="/admin/line-setup" className="text-blue-600 underline">共通QRコード</Link>から友だち追加<br />
                        2. 自動表示される店舗リストから選択<br />
                        3. 自動的に登録完了！
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-800 font-semibold">
                        ✅ LINE連携済み
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">LINE User ID</label>
                      <input
                        type="text"
                        name="lineUserId"
                        value={store.lineUserId || ''}
                        className="w-full px-3 py-2 border rounded bg-gray-100 font-mono text-xs sm:text-sm break-all cursor-not-allowed"
                        readOnly
                        disabled
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="lineManagerActive"
                        checked={store.lineManagerActive || false}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm">LINE連携を有効にする</span>
                    </label>
                    <div className="text-sm text-gray-600">
                      <p>登録解除する場合は、LINE User IDを削除して保存してください。</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('LINE連携を解除しますか？')) {
                          setStore({ 
                            ...store, 
                            lineUserId: '',
                            lineManagerActive: false 
                          });
                        }
                      }}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
                    >
                      LINE連携を解除
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">店長名</label>
                  <input
                    type="text"
                    name="managerName"
                    value={store.managerName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">店長写真</label>
                  <ImageUpload
                    value={store.managerPhoto || ''}
                    onChange={(url) => setStore({ ...store, managerPhoto: url })}
                    placeholder="/images/manager/store-name.jpg"
                    circular
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">店長コメント</label>
                  <textarea
                    name="managerComment"
                    value={store.managerComment || ''}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="お客様へのメッセージを入力してください"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 画像管理タブ */}
          {activeTab === 'images' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">画像管理</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">トップページ用画像</label>
                  <ImageUpload
                    value={store.topImage || ''}
                    onChange={(url) => setStore({ ...store, topImage: url })}
                    placeholder="/images/top/store-name.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">詳細ページトップ画像</label>
                  <ImageUpload
                    value={store.detailImage1 || ''}
                    onChange={(url) => setStore({ ...store, detailImage1: url })}
                    placeholder="/images/detail1/store-name.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">詳細ページその2画像</label>
                  <ImageUpload
                    value={store.detailImage2 || ''}
                    onChange={(url) => setStore({ ...store, detailImage2: url })}
                    placeholder="/images/detail2/store-name.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">外観画像</label>
                  <ImageUpload
                    value={store.exteriorImage || ''}
                    onChange={(url) => setStore({ ...store, exteriorImage: url })}
                    placeholder="/exterior/store-name.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">その他の画像URL（カンマ区切り）</label>
                  <textarea
                    name="images"
                    value={store.images.join(', ')}
                    onChange={(e) => setStore({ ...store, images: e.target.value.split(',').map(url => url.trim()).filter(url => url) })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="/images/store1.jpg, /images/store2.jpg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* メニュー管理タブ */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">メニュー管理</h2>
              <p className="text-gray-600 mb-4">メニューの詳細編集は専用ページで行います。</p>
              <Link 
                href={`/admin/stores/${store._id}/menus`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                メニュー編集ページへ
              </Link>
            </div>
          )}

          {/* スタッフ管理タブ */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">スタッフ管理</h2>
              
              {/* スタッフコメント管理 */}
              <div className="mb-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">スタッフコメント</h3>
                <p className="text-sm text-gray-600 mb-3">
                  スタッフから投稿されたコメントの履歴管理ができます。
                </p>
                <Link 
                  href={`/admin/stores/${store._id}/staff-comments`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  コメント履歴を見る
                </Link>
                {store.staffComments && store.staffComments.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    （全{store.staffComments.length}件）
                  </span>
                )}
              </div>

              {/* 登録済みスタッフ一覧 */}
              <div>
                <h3 className="font-semibold mb-3">登録済みスタッフ</h3>
                {store.staffMembers && store.staffMembers.length > 0 ? (
                  <div className="space-y-3">
                    {store.staffMembers.map((staff, index) => (
                      <div key={index} className="border rounded p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-gray-600">{staff.role}</p>
                          <p className="text-xs text-gray-500">登録日: {new Date(staff.addedAt).toLocaleDateString('ja-JP')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            staff.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {staff.isActive ? '有効' : '無効'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">スタッフが登録されていません</p>
                )}
              </div>

              {/* スタッフ追加案内 */}
              <div className="mt-6 p-4 bg-yellow-50 rounded">
                <p className="text-sm">
                  <strong>スタッフの追加方法：</strong><br />
                  1. <Link href="/admin/line-setup" className="text-blue-600 underline">共通QRコード</Link>からLINE友だち追加<br />
                  2. 店舗と役職を選択して自動登録<br />
                  3. このページで名前を編集可能
                </p>
              </div>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 sm:py-2 rounded hover:bg-blue-700"
            >
              保存する
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}