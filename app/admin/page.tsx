'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface Store {
  _id: string;
  name: string;
  category: string;
  description: string;
  openingHours: string;
  closedDays: string[];
  phone: string;
  address: string;
  topImage?: string;
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`本当に「${name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('店舗を削除しました');
        fetchStores();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      console.error('店舗の削除に失敗しました:', error);
      alert('店舗の削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">八丈島親不孝通り 管理システム</h1>
          <Link href="/" className="text-blue-400 hover:underline text-sm sm:text-base">
            ← サイトに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* 管理メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/admin/line-managers" className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-blue-600 mb-2">LINE連携管理</h3>
            <p className="text-sm text-gray-600">店長のLINEアカウントを管理し、コメント自動更新を設定</p>
          </Link>
          <Link href="/admin/line-setup" className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-green-600 mb-2">LINE Bot設定</h3>
            <p className="text-sm text-gray-600">共通QRコードと登録手順を確認</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold">店舗管理</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">カテゴリー *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 居酒屋"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">説明 *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">営業時間 *</label>
                  <input
                    type="text"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 19:00-3:00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">定休日</label>
                  <input
                    type="text"
                    name="closedDays"
                    value={formData.closedDays.join(', ')}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 月曜日, 第2・第4火曜日"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">電話番号 *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">住所 *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">外観画像</label>
                  <ImageUpload
                    value={formData.exteriorImage}
                    onChange={(url) => setFormData(prev => ({ ...prev, exteriorImage: url }))}
                    placeholder="/images/exterior/store-name.jpg"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  店舗を追加
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : stores.length === 0 ? (
            <p className="text-gray-500">店舗が登録されていません。</p>
          ) : (
            <>
              {/* モバイル表示 */}
              <div className="sm:hidden space-y-4">
                {stores.map((store) => (
                  <div key={store._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{store.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        store.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {store.isOpen ? '営業中' : '休業中'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{store.category}</p>
                    <p className="text-sm text-gray-600 mb-3">{store.openingHours}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/stores/${store._id}`}
                        className="text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                      >
                        編集
                      </Link>
                      <Link
                        href={`/admin/stores/${store._id}/menus`}
                        className="text-center bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        メニュー
                      </Link>
                      <Link
                        href={`/admin/stores/${store._id}/staff-comments`}
                        className="text-center bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                      >
                        スタッフ
                      </Link>
                      <button
                        onClick={() => handleDelete(store._id, store.name)}
                        className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* デスクトップ表示 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        店舗名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        カテゴリー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        営業時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stores.map((store) => (
                      <tr key={store._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.openingHours}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            store.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {store.isOpen ? '営業中' : '休業中'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/stores/${store._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            編集
                          </Link>
                          <Link
                            href={`/admin/stores/${store._id}/menus`}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            メニュー
                          </Link>
                          <Link
                            href={`/admin/stores/${store._id}/staff-comments`}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            スタッフ
                          </Link>
                          <button
                            onClick={() => handleDelete(store._id, store.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}