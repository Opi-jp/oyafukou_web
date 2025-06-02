'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Store {
  _id: string;
  name: string;
  category: string;
  description: string;
  openingHours: string;
  closedDays: string[];
  phone: string;
  address: string;
  exteriorImage: string;
  isOpen: boolean;
}

export default function Admin() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    openingHours: '',
    closedDays: [] as string[],
    phone: '',
    address: '',
    exteriorImage: '',
    isOpen: true
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('店舗データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('店舗を追加しました');
        setShowAddForm(false);
        setFormData({
          name: '',
          category: '',
          description: '',
          openingHours: '',
          closedDays: [],
          phone: '',
          address: '',
          exteriorImage: '',
          isOpen: true
        });
        fetchStores();
      }
    } catch (error) {
      console.error('店舗の追加に失敗しました:', error);
      alert('店舗の追加に失敗しました');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'closedDays') {
      setFormData(prev => ({ ...prev, [name]: value.split(',').map(day => day.trim()) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">八丈島親不孝通り 管理システム</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            ← サイトに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">店舗管理</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showAddForm ? '閉じる' : '新規店舗追加'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-4">新規店舗追加</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">店舗名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
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
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="例: 焼肉, 寿司, ラーメン"
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">説明 *</label>
                  <textarea
                    name="description"
                    value={formData.description}
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
                    value={formData.openingHours}
                    onChange={handleInputChange}
                    placeholder="例: 17:00-02:00"
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">定休日</label>
                  <input
                    type="text"
                    name="closedDays"
                    value={formData.closedDays.join(', ')}
                    onChange={handleInputChange}
                    placeholder="例: 月曜日, 火曜日"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">電話番号</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="例: 04996-2-5800"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">住所 *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">外観画像URL</label>
                  <input
                    type="text"
                    name="exteriorImage"
                    value={formData.exteriorImage}
                    onChange={handleInputChange}
                    placeholder="例: /exterior/store-name.jpg"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isOpen"
                      checked={formData.isOpen}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">営業中</span>
                  </label>
                </div>
              </div>
              <button 
                type="submit"
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                追加
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-center py-4">読み込み中...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">店舗名</th>
                    <th className="px-4 py-2 text-left">カテゴリー</th>
                    <th className="px-4 py-2 text-left">営業時間</th>
                    <th className="px-4 py-2 text-left">定休日</th>
                    <th className="px-4 py-2 text-left">状態</th>
                    <th className="px-4 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store._id} className="border-b">
                      <td className="px-4 py-2">{store.name}</td>
                      <td className="px-4 py-2">{store.category}</td>
                      <td className="px-4 py-2">{store.openingHours}</td>
                      <td className="px-4 py-2">{store.closedDays.join(', ') || 'なし'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          store.isOpen 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.isOpen ? '営業中' : '休業中'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Link 
                          href={`/admin/stores/${store._id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stores.length === 0 && (
                <p className="text-center py-4 text-gray-500">登録されている店舗がありません。</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}