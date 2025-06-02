'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';

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
  menuHighlights: MenuItem[];
  regularMenu: CategoryMenuItem[];
  drinkMenu: CategoryMenuItem[];
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
}

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommend');

  useEffect(() => {
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

    if (params.id) {
      fetchStore(params.id as string);
    }
  }, [params.id, router]);


  // メニューをカテゴリ別にグループ化
  const groupByCategory = (items: CategoryMenuItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, CategoryMenuItem[]>);
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

  const groupedMenu = groupByCategory(store.regularMenu || []);
  const groupedDrinks = groupByCategory(store.drinkMenu || []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ヘッダー */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#FF6B4A] hover:text-[#FF8A6A] transition-colors">
            ← 一覧に戻る
          </Link>
          <div className={`px-3 py-1 rounded text-sm font-bold ${
            store.temporaryClosed
              ? 'bg-orange-500/20 text-orange-500'
              : store.isOpen 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-red-500/20 text-red-500'
          }`}>
            {store.temporaryClosed ? '臨時休業' : store.isOpen ? '営業中' : '定休日'}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 店舗情報とトップ画像 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-[#FF6B4A] text-white px-4 py-2 rounded text-sm font-bold">
              {store.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black">{store.name}</h1>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{store.description}</p>

          {/* 臨時休業のお知らせ */}
          {store.temporaryClosed && (
            <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6">
              <p className="text-orange-500 font-bold mb-1">⚠️ 臨時休業中</p>
              {store.temporaryClosedReason && (
                <p className="text-orange-300 text-sm">理由：{store.temporaryClosedReason}</p>
              )}
            </div>
          )}

          {/* 詳細ページトップ画像 */}
          {store.detailImage1 && (
            <div className="h-64 md:h-96 overflow-hidden rounded-lg bg-[#1A1A1A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={store.detailImage1} 
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* 店長コメント */}
        {(store.managerName || store.managerComment || store.managerPhoto) && (
          <div className="mb-8">
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
              <h3 className="text-lg font-bold mb-4 text-[#FFD700]">店長より</h3>
              <div className="flex flex-col items-center">
                {store.managerPhoto ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-[#FFD700]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={store.managerPhoto} 
                      alt={store.managerName || '店長'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4 border-4 border-[#FFD700]">
                    <span className="text-gray-500 text-sm font-bold">NO IMAGE</span>
                  </div>
                )}
                {store.managerName && (
                  <p className="text-lg font-bold mb-4">{store.managerName}</p>
                )}
                {store.managerComment && (
                  <div className="relative w-full max-w-md">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-[#FFD700]"></div>
                    <div className="bg-[#FFD700] text-black p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{store.managerComment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* メニュータブ */}
        <div className="mb-8">
          {/* タブナビゲーション */}
          <div className="flex border-b border-[#2A2A2A] mb-6">
            <button
              onClick={() => setActiveTab('recommend')}
              className={`px-6 py-3 font-bold text-lg transition-colors ${
                activeTab === 'recommend'
                  ? 'text-[#FF6B4A] border-b-2 border-[#FF6B4A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              おすすめ
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-3 font-bold text-lg transition-colors ${
                activeTab === 'menu'
                  ? 'text-[#FF6B4A] border-b-2 border-[#FF6B4A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              メニュー
            </button>
            <button
              onClick={() => setActiveTab('drink')}
              className={`px-6 py-3 font-bold text-lg transition-colors ${
                activeTab === 'drink'
                  ? 'text-[#FF6B4A] border-b-2 border-[#FF6B4A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ドリンク
            </button>
          </div>

          {/* おすすめタブ */}
          {activeTab === 'recommend' && (
            <div>
              {store.menuHighlights && store.menuHighlights.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {store.menuHighlights.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#2A2A2A] hover:border-[#FF6B4A] transition-colors"
                    >
                      <div className="h-48 overflow-hidden bg-[#0A0A0A]">
                        {item.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#2A2A2A]">
                            <span className="text-2xl font-bold text-gray-500">NO IMAGE</span>
                          </div>
                        )}
                      </div>
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
              ) : (
                <p className="text-gray-400 text-center py-8">おすすめメニューは現在準備中です</p>
              )}
            </div>
          )}

          {/* メニュータブ */}
          {activeTab === 'menu' && (
            <div>
              {Object.keys(groupedMenu).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedMenu).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold mb-4 text-[#FFD700]">{category}</h3>
                      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A]">
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#2A2A2A] last:border-0">
                              <span className="text-lg">{item.name}</span>
                              <span className="text-[#FF6B4A] font-bold">¥{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">メニューは現在準備中です</p>
              )}
            </div>
          )}

          {/* ドリンクタブ */}
          {activeTab === 'drink' && (
            <div>
              {Object.keys(groupedDrinks).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedDrinks).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold mb-4 text-[#FFD700]">{category}</h3>
                      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A]">
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#2A2A2A] last:border-0">
                              <span className="text-lg">{item.name}</span>
                              <span className="text-[#FF6B4A] font-bold">¥{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">ドリンクメニューは現在準備中です</p>
              )}
            </div>
          )}
        </div>

        {/* 詳細ページその2画像 */}
        {store.detailImage2 && (
          <div className="mb-8">
            <div className="h-64 md:h-96 overflow-hidden rounded-lg bg-[#1A1A1A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={store.detailImage2} 
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* ギャラリー */}
        {store.images && store.images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6B4A]">ギャラリー</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.images.map((image, index) => (
                <div key={index} className="h-48 overflow-hidden rounded-lg bg-[#1A1A1A]">
                  {image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={image} 
                      alt={`${store.name} ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2A2A2A]">
                      <span className="text-2xl font-bold text-gray-500">NO IMAGE</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 基本情報（最後に配置） */}
        <div className={store.phone ? "mb-40" : "mb-20"}>
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
      </main>
      
      <Footer />

      {/* 電話ボタン（スティッキー） */}
      {store.phone && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2A2A2A] p-4 z-50">
          <a 
            href={`tel:${store.phone}`}
            className="block w-full max-w-md mx-auto bg-[#FF6B4A] hover:bg-[#FF8A6A] text-white text-center py-4 rounded-lg font-bold text-lg transition-colors"
          >
            📞 電話する
          </a>
        </div>
      )}
    </div>
  );
}