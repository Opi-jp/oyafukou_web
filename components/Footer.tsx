import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t border-[#2A2A2A] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-[#FF6B4A] font-bold mb-4">八丈島親不孝通り</h3>
            <p className="text-gray-400 text-sm">
              誰が呼んだか情け嶋。<br />
              八丈島の夜はここにいくしかないのです。
            </p>
          </div>
          <div>
            <h3 className="text-[#FF6B4A] font-bold mb-4">メニュー</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  店舗一覧
                </Link>
              </li>
              <li>
                <Link href="/access" className="text-gray-400 hover:text-white text-sm transition-colors">
                  アクセス
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[#FF6B4A] font-bold mb-4">所在地</h3>
            <p className="text-gray-400 text-sm">
              〒100-1401<br />
              東京都八丈島八丈町三根
            </p>
          </div>
        </div>
        <div className="border-t border-[#2A2A2A] mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; 2024 八丈島親不孝通り. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}