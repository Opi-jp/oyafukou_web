'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface MenuItem {
  name: string;
  price: number;
  description: string;
  image?: string;
  isRecommended?: boolean;
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
  menuHighlights: MenuItem[];
  exteriorImage?: string;
  images: string[];
  isOpen: boolean;
}

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
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
      if (!response.ok) {
        throw new Error('Store not found');
      }
      const data = await response.json();
      setStore(data);
    } catch (error) {
      console.error('店舗データの取得に失敗しました:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ヘッダー */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#FF6B4A] hover:text-[#FF8A6A] transition-colors">
            ← 一覧に戻る
          </Link>
          <div className={`px-3 py-1 rounded text-sm font-bold ${
            store.isOpen 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-red-500/20 text-red-500'
          }`}>
            {store.isOpen ? '営業中' : '休業中'}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 店舗情報 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-[#FF6B4A] text-white px-4 py-2 rounded text-sm font-bold">
              {store.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black">{store.name}</h1>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{store.description}</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 外観画像 */}
            {store.exteriorImage && (
              <div className="h-64 md:h-96 overflow-hidden rounded-lg bg-[#1A1A1A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={store.exteriorImage.replace('/images/', '/')} 
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 基本情報 */}
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
                <h2 className="text-xl font-bold mb-4 text-[#FF6B4A]">基本情報</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-gray-400 text-sm">営業時間</dt>
                    <dd className="text-lg">{store.openingHours}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-sm">定休日</dt>
                    <dd className="text-lg">{store.closedDays.join('、') || 'なし'}</dd>
                  </div>
                  {store.phone && (
                    <div>
                      <dt className="text-gray-400 text-sm">電話番号</dt>
                      <dd className="text-lg">{store.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-400 text-sm">住所</dt>
                    <dd className="text-lg">{store.address}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* メニューハイライト */}
        {store.menuHighlights && store.menuHighlights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B4A]">おすすめメニュー</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.menuHighlights.map((item, index) => (
                <div 
                  key={index}
                  className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#2A2A2A] hover:border-[#FF6B4A] transition-colors"
                >
                  {item.image && (
                    <div className="h-48 overflow-hidden bg-[#0A0A0A]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      {item.isRecommended && (
                        <span className="bg-[#FFD700] text-black px-2 py-1 rounded text-xs font-bold">
                          おすすめ
                        </span>
                      )}
                    </div>
                    <p className="text-[#FF6B4A] font-bold text-xl mb-2">¥{item.price.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* その他の画像 */}
        {store.images && store.images.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B4A]">ギャラリー</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.images.map((image, index) => (
                <div key={index} className="h-48 overflow-hidden rounded-lg bg-[#1A1A1A]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={image} 
                    alt={`${store.name} ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}