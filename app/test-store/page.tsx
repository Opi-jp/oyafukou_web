'use client';

export default function TestStorePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <h1 className="text-2xl font-bold mb-4">テストページ</h1>
      <p>このページが表示されれば、デプロイは成功しています。</p>
      <p className="mt-4">現在の時刻: {new Date().toLocaleString('ja-JP')}</p>
    </div>
  );
}