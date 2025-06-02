'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  exteriorImage?: string;
  images: string[];
  isOpen: boolean;
  temporaryClosed?: boolean;
  temporaryClosedReason?: string;
  menuHighlights: MenuItem[];
  regularMenu: CategoryMenuItem[];
  drinkMenu: CategoryMenuItem[];
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
      const response = await fetch(`/api/stores/${store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(store),
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">店舗編集: {store.name}</h1>
          <Link href="/admin" className="text-blue-400 hover:underline">
            ← 管理画面に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <form onSubmit={handleSubmit}>
          {/* タブナビゲーション */}
          <div className="flex border-b mb-6">
            {['basic', 'manager', 'images', 'menu'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'basic' && '基本情報'}
                {tab === 'manager' && '店長情報'}
                {tab === 'images' && '画像管理'}
                {tab === 'menu' && 'メニュー管理'}
              </button>
            ))}
          </div>

          {/* 基本情報タブ */}
          {activeTab === 'basic' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">基本情報</h2>
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">店長情報</h2>
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium mb-1">店長写真URL</label>
                  <input
                    type="text"
                    name="managerPhoto"
                    value={store.managerPhoto || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/images/manager/store-name.jpg"
                  />
                  {store.managerPhoto && (
                    <div className="mt-2 w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={store.managerPhoto} 
                        alt="店長写真プレビュー"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">画像管理</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">トップ画像URL</label>
                  <input
                    type="text"
                    name="topImage"
                    value={store.topImage || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/images/top/store-name.jpg"
                  />
                  {store.topImage && (
                    <div className="mt-2 w-32 h-32 overflow-hidden rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={store.topImage} 
                        alt="トップ画像プレビュー"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">外観画像URL</label>
                  <input
                    type="text"
                    name="exteriorImage"
                    value={store.exteriorImage || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/exterior/store-name.jpg"
                  />
                  {store.exteriorImage && (
                    <div className="mt-2 w-32 h-32 overflow-hidden rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={store.exteriorImage} 
                        alt="外観画像プレビュー"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">その他の画像URL（カンマ区切り）</label>
                  <textarea
                    name="images"
                    value={store.images.join(', ')}
                    onChange={(e) => setStore({ ...store, images: e.target.value.split(',').map(url => url.trim()).filter(url => url) })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/images/store1.jpg, /images/store2.jpg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* メニュー管理タブ */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">メニュー管理</h2>
              <p className="text-gray-600 mb-4">メニューの詳細編集は専用ページで行います。</p>
              <Link 
                href={`/admin/stores/${store._id}/menus`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                メニュー編集ページへ
              </Link>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              保存する
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}