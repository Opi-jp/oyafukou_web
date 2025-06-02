'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Store {
  _id: string;
  name: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    // 店舗一覧を取得
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };
    fetchStores();
  }, []);

  return (
    <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <div className="flex-1">
            <Link href="/" className="inline-block">
              <Image 
                src="/logo/親不孝通り_logo_yoko.svg" 
                alt="八丈島親不孝通り" 
                width={240} 
                height={60} 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="text-white hover:text-[#FF6B4A] transition-colors px-3 py-1">
              ホーム
            </Link>
            <span className="text-gray-500">｜</span>
            <Link href="/access" className="text-white hover:text-[#FF6B4A] transition-colors px-3 py-1">
              アクセス
            </Link>
            <span className="text-gray-500">｜</span>
            <div className="relative group">
              <button className="text-white hover:text-[#FF6B4A] transition-colors flex items-center gap-1 px-3 py-1">
                各店舗
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {stores.map(store => (
                  <Link
                    key={store._id}
                    href={`/stores/${store._id}`}
                    className="block px-4 py-2 text-white hover:bg-[#2A2A2A] hover:text-[#FF6B4A] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {store.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-[#FF6B4A] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <Link 
              href="/" 
              className="block py-2 text-white hover:text-[#FF6B4A] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link 
              href="/access" 
              className="block py-2 text-white hover:text-[#FF6B4A] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              アクセス
            </Link>
            <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
              <p className="text-sm text-gray-400 mb-2">各店舗</p>
              {stores.map(store => (
                <Link
                  key={store._id}
                  href={`/stores/${store._id}`}
                  className="block py-2 pl-4 text-white hover:text-[#FF6B4A] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {store.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}