'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { SiteStructuredData } from '@/components/StructuredData';

interface Store {
  _id: string;
  name: string;
  category: string;
  description: string;
  openingHours: string;
  closedDays: string[];
  topImage?: string;
  exteriorImage?: string;
  isOpen: boolean;
}

export default function Home() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <SiteStructuredData />
      <Header />
      {/* ヒーローセクション */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center mb-4 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/hero-background.png)',
            filter: 'brightness(0.4)'
          }}
        />
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <Image 
            src="/CATCH_MAIN.svg" 
            alt="親には言えない夜が、ここにある" 
            width={600}
            height={200}
            priority
            className="w-full max-w-[600px] h-auto mb-6 mx-auto"
          />
          <p className="text-base leading-relaxed mb-8 max-w-2xl mx-auto text-left">
            誰が呼んだか情け嶋。車社会の八丈島で唯一、はしご酒ができるエリア。
            それが「八丈島親不孝通り」。飲食店が軒を連ねるこのエリア、
            島で唯一のカラオケボックスもここに。八丈島の夜はここにいくしかないのです。
          </p>
          <Link 
            href="/access"
            className="inline-block bg-[#FF6B4A] text-white px-8 py-4 rounded font-bold text-xl shadow-lg hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            今すぐ行く
          </Link>
        </div>
      </section>


      {/* 店舗一覧 */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-4xl font-black text-[#FF6B4A] text-center mb-8 pb-2 border-b-4 border-[#8B1874]">
          夜の冒険、<br className="md:hidden" />どこから始める？
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl">読み込み中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map(store => (
              <Link href={`/stores/${store._id}`} key={store._id}>
                <div className="bg-[#1A1A1A] rounded-lg overflow-hidden hover:transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-[#2A2A2A] hover:border-[#FF6B4A]">
                  <div className="h-48 overflow-hidden bg-[#0A0A0A]">
                    {store.topImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={store.topImage} 
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2A2A2A]">
                        <span className="text-2xl font-bold text-gray-500">NO IMAGE</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="inline-block bg-[#FF6B4A] text-white px-3 py-1 rounded text-sm font-bold mb-2">
                      {store.category}
                    </span>
                    <h3 className="text-xl font-black mb-2">{store.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{store.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>営業: {store.openingHours}</span>
                      <span className={`px-2 py-1 rounded font-bold ${
                        store.isOpen 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {store.isOpen ? '営業中' : '休業中'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}