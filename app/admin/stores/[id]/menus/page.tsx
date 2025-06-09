'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

interface Store {
  _id: string;
  name: string;
  menuHighlights: MenuItem[];
  regularMenu: CategoryMenuItem[];
  drinkMenu: CategoryMenuItem[];
}

export default function MenuManager() {
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommend');
  
  // フォーム状態
  const [recommendForm, setRecommendForm] = useState<MenuItem>({
    name: '',
    price: 0,
    description: '',
    image: '',
    isRecommended: true
  });
  
  const [menuForm, setMenuForm] = useState<CategoryMenuItem>({
    name: '',
    price: 0,
    category: ''
  });
  
  const [drinkForm, setDrinkForm] = useState<CategoryMenuItem>({
    name: '',
    price: 0,
    category: ''
  });

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

  const updateStore = async () => {
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
        alert('メニューを更新しました');
      }
    } catch (error) {
      console.error('メニューの更新に失敗しました:', error);
      alert('メニューの更新に失敗しました');
    }
  };

  // おすすめメニュー追加
  const addRecommendItem = () => {
    if (!store || !recommendForm.name || !recommendForm.price) return;
    
    const newHighlights = [...store.menuHighlights, recommendForm];
    setStore({ ...store, menuHighlights: newHighlights });
    setRecommendForm({
      name: '',
      price: 0,
      description: '',
      image: '',
      isRecommended: true
    });
  };

  // おすすめメニュー削除
  const deleteRecommendItem = (index: number) => {
    if (!store) return;
    const newHighlights = store.menuHighlights.filter((_, i) => i !== index);
    setStore({ ...store, menuHighlights: newHighlights });
  };

  // 通常メニュー追加
  const addMenuItem = () => {
    if (!store || !menuForm.name || !menuForm.price || !menuForm.category) return;
    
    const newMenu = [...store.regularMenu, menuForm];
    setStore({ ...store, regularMenu: newMenu });
    setMenuForm({ name: '', price: 0, category: '' });
  };

  // 通常メニュー削除
  const deleteMenuItem = (index: number) => {
    if (!store) return;
    const newMenu = store.regularMenu.filter((_, i) => i !== index);
    setStore({ ...store, regularMenu: newMenu });
  };

  // ドリンクメニュー追加
  const addDrinkItem = () => {
    if (!store || !drinkForm.name || !drinkForm.price || !drinkForm.category) return;
    
    const newDrinks = [...store.drinkMenu, drinkForm];
    setStore({ ...store, drinkMenu: newDrinks });
    setDrinkForm({ name: '', price: 0, category: '' });
  };

  // ドリンクメニュー削除
  const deleteDrinkItem = (index: number) => {
    if (!store) return;
    const newDrinks = store.drinkMenu.filter((_, i) => i !== index);
    setStore({ ...store, drinkMenu: newDrinks });
  };

  // カテゴリー別にグループ化
  const groupByCategory = (items: CategoryMenuItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, CategoryMenuItem[]>);
    return grouped;
  };

  if (loading) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">読み込み中...</div>;
  if (!store) return <div className="min-h-screen bg-gray-100 text-gray-900 p-6">店舗が見つかりません</div>;

  const groupedMenu = groupByCategory(store.regularMenu || []);
  const groupedDrinks = groupByCategory(store.drinkMenu || []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">メニュー管理: {store.name}</h1>
          <Link href={`/admin/stores/${store._id}`} className="text-blue-400 hover:underline text-sm sm:text-base">
            ← 店舗編集に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* タブナビゲーション - モバイル対応 */}
        <div className="flex overflow-x-auto border-b mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {['recommend', 'menu', 'drink'].map((tab) => (
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
              {tab === 'recommend' && 'おすすめメニュー'}
              {tab === 'menu' && '通常メニュー'}
              {tab === 'drink' && 'ドリンクメニュー'}
            </button>
          ))}
        </div>

        {/* おすすめメニューTab */}
        {activeTab === 'recommend' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">おすすめメニュー管理</h2>
            
            {/* 追加フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold mb-4">新規追加</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="メニュー名"
                    value={recommendForm.name}
                    onChange={(e) => setRecommendForm({ ...recommendForm, name: e.target.value })}
                    className="px-3 py-2 border rounded w-full"
                  />
                  <input
                    type="number"
                    placeholder="価格"
                    value={recommendForm.price || ''}
                    onChange={(e) => setRecommendForm({ ...recommendForm, price: parseInt(e.target.value) || 0 })}
                    className="px-3 py-2 border rounded w-full"
                  />
                </div>
                <div>
                  <ImageUpload
                    value={recommendForm.image || ''}
                    onChange={(url) => setRecommendForm({ ...recommendForm, image: url })}
                    placeholder="画像をアップロード"
                  />
                </div>
                <textarea
                  placeholder="説明"
                  value={recommendForm.description}
                  onChange={(e) => setRecommendForm({ ...recommendForm, description: e.target.value })}
                  className="px-3 py-2 border rounded w-full"
                  rows={2}
                />
              </div>
              <button
                onClick={addRecommendItem}
                className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                追加
              </button>
            </div>

            {/* 一覧 */}
            <div className="space-y-4">
              {store.menuHighlights.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-gray-600">¥{item.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => deleteRecommendItem(index)}
                    className="w-full sm:w-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 通常メニューTab */}
        {activeTab === 'menu' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">通常メニュー管理</h2>
            
            {/* 追加フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold mb-4">新規追加</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="メニュー名"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="px-3 py-2 border rounded w-full"
                />
                <input
                  type="number"
                  placeholder="価格"
                  value={menuForm.price || ''}
                  onChange={(e) => setMenuForm({ ...menuForm, price: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="カテゴリー（例: 焼き物）"
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              <button
                onClick={addMenuItem}
                className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                追加
              </button>
            </div>

            {/* カテゴリー別表示 */}
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="font-bold text-lg mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = store.regularMenu.findIndex(
                      m => m.name === item.name && m.category === item.category
                    );
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded gap-2">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">¥{item.price.toLocaleString()}</span>
                          <button
                            onClick={() => deleteMenuItem(globalIndex)}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ドリンクメニューTab */}
        {activeTab === 'drink' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">ドリンクメニュー管理</h2>
            
            {/* 追加フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold mb-4">新規追加</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="ドリンク名"
                  value={drinkForm.name}
                  onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })}
                  className="px-3 py-2 border rounded w-full"
                />
                <input
                  type="number"
                  placeholder="価格"
                  value={drinkForm.price || ''}
                  onChange={(e) => setDrinkForm({ ...drinkForm, price: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="カテゴリー（例: ビール）"
                  value={drinkForm.category}
                  onChange={(e) => setDrinkForm({ ...drinkForm, category: e.target.value })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              <button
                onClick={addDrinkItem}
                className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                追加
              </button>
            </div>

            {/* カテゴリー別表示 */}
            {Object.entries(groupedDrinks).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="font-bold text-lg mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = store.drinkMenu.findIndex(
                      d => d.name === item.name && d.category === item.category
                    );
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded gap-2">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">¥{item.price.toLocaleString()}</span>
                          <button
                            onClick={() => deleteDrinkItem(globalIndex)}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={updateStore}
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 sm:py-2 rounded hover:bg-green-700"
          >
            すべて保存
          </button>
        </div>
      </main>
    </div>
  );
}