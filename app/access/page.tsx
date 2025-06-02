import Link from 'next/link';
import Footer from '@/components/Footer';

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ヘッダー */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-[#FF6B4A] hover:text-[#FF8A6A] transition-colors">
            ← トップに戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black text-center mb-12 text-[#FF6B4A]">
          八丈島親不孝通りへのアクセス
        </h1>

        {/* 地図セクション */}
        <section className="mb-12">
          <div className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#2A2A2A]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.8988931577654!2d139.79661031520622!3d33.10747498087559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDA2JzI2LjkiTiAxMznCsDQ3JzU1LjgiRQ!5e0!3m2!1sja!2sjp!4v1650000000000!5m2!1sja!2sjp"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
          </div>
        </section>

        {/* アクセス方法 */}
        <section className="space-y-8">
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B4A]">所在地</h2>
            <p className="text-lg">東京都八丈島八丈町三根</p>
            <p className="text-gray-400 mt-2">※親不孝通りは通称です。正式な地名ではありません。</p>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B4A]">空港からのアクセス</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-[#FFD700] mr-2">🚕</span>
                <div>
                  <p className="font-bold">タクシー（推奨）</p>
                  <p className="text-gray-400">八丈島空港から約2,000円（約10分）</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#FFD700] mr-2">🚗</span>
                <div>
                  <p className="font-bold">レンタカー</p>
                  <p className="text-gray-400">八丈島空港から車で約10分</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#FFD700] mr-2">🚌</span>
                <div>
                  <p className="font-bold">路線バス</p>
                  <p className="text-gray-400">空港から「神湊」行きバスで「大賀郷園地前」下車、徒歩5分</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B4A]">港からのアクセス</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-[#FFD700] mr-2">🚗</span>
                <div>
                  <p className="font-bold">レンタカー</p>
                  <p className="text-gray-400">底土港から車で約15分、八重根港から車で約20分</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#FFD700] mr-2">🚌</span>
                <div>
                  <p className="font-bold">路線バス</p>
                  <p className="text-gray-400">各港から町営バスが運行（本数限定）</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B4A]">タクシー会社情報</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-[#FFD700] pl-4">
                <h3 className="font-bold text-lg mb-1">八丈島タクシー</h3>
                <p className="text-gray-400 mb-2">電話：04996-2-1111</p>
                <a href="tel:04996-2-1111" className="inline-block bg-[#FF6B4A] hover:bg-[#FF8A6A] text-white px-4 py-2 rounded font-bold transition-colors">
                  📞 タクシーを呼ぶ
                </a>
              </div>
              <div className="border-l-4 border-[#FFD700] pl-4">
                <h3 className="font-bold text-lg mb-1">やすらタクシー</h3>
                <p className="text-gray-400 mb-2">電話：04996-2-2222</p>
                <a href="tel:04996-2-2222" className="inline-block bg-[#FF6B4A] hover:bg-[#FF8A6A] text-white px-4 py-2 rounded font-bold transition-colors">
                  📞 タクシーを呼ぶ
                </a>
              </div>
              <div className="border-l-4 border-[#FFD700] pl-4">
                <h3 className="font-bold text-lg mb-1">かわいタクシー</h3>
                <p className="text-gray-400 mb-2">電話：04996-2-3333</p>
                <a href="tel:04996-2-3333" className="inline-block bg-[#FF6B4A] hover:bg-[#FF8A6A] text-white px-4 py-2 rounded font-bold transition-colors">
                  📞 タクシーを呼ぶ
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">※上記は例です。実際のタクシー会社情報を確認してください。</p>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#FF6B4A]">駐車場情報</h2>
            <p className="mb-2">各店舗に駐車場あり（無料）</p>
            <p className="text-gray-400">※飲酒運転は絶対にやめましょう。</p>
          </div>

          <div className="bg-[#FFD700]/10 p-6 rounded-lg border border-[#FFD700]/30">
            <h2 className="text-2xl font-bold mb-4 text-[#FFD700]">⚠️ ご注意</h2>
            <ul className="space-y-2 text-lg">
              <li>• 八丈島は車社会です。レンタカーの利用を強く推奨します</li>
              <li>• 夜間の路線バスは本数が非常に少ないです</li>
              <li>• 飲酒される場合は、宿泊先の送迎や代行運転をご利用ください</li>
              <li>• 島内タクシーの台数は限られています</li>
            </ul>
          </div>
        </section>

        {/* お問い合わせ */}
        <section className="mt-12 text-center">
          <p className="text-gray-400">
            アクセスに関するお問い合わせは各店舗まで直接お願いします
          </p>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}