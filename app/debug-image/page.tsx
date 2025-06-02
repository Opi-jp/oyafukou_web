'use client';

import { useState } from 'react';

export default function DebugImagePage() {
  const [imageUrl, setImageUrl] = useState('');
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const testUrls = [
    'https://qycgp9nwsea3fxvl.public.blob.vercel-storage.com/1748838832336-yakitori3.jpg',
    'https://qycgp9nwsea3fxvl.public.blob.vercel-storage.com/1748838060553-yakiniku3.jpg',
    '/exterior/三年目の浮気.jpg',
    '/exterior/sannenme-uwaki.jpg'
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">画像デバッグページ</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">カスタムURL入力</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="画像URLを入力"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => setImageStatus('loading')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            テスト
          </button>
        </div>
        
        {imageUrl && (
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600 mb-2">URL: {imageUrl}</p>
            <p className="text-sm mb-4">ステータス: {imageStatus}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Test"
              className="w-64 h-48 object-cover border"
              onLoad={() => {
                console.log('画像読み込み成功:', imageUrl);
                setImageStatus('success');
              }}
              onError={(e) => {
                console.error('画像読み込みエラー:', imageUrl, e);
                setImageStatus('error');
              }}
            />
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4">テストURL一覧</h2>
        <div className="space-y-4">
          {testUrls.map((url, index) => (
            <TestImage key={index} url={url} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestImage({ url }: { url: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  return (
    <div className="p-4 bg-gray-50 rounded">
      <p className="text-sm text-gray-600 mb-2 break-all">URL: {url}</p>
      <p className="text-sm mb-2">
        ステータス: 
        <span className={`ml-2 font-semibold ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-yellow-600'
        }`}>
          {status === 'success' ? '✓ 成功' : 
           status === 'error' ? '✗ エラー' : 
           '⏳ 読み込み中...'}
        </span>
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Test"
        className="w-48 h-32 object-cover border bg-gray-200"
        onLoad={() => setStatus('success')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}