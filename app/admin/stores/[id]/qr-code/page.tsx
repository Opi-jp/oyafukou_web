'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import QRCode from 'qrcode';

interface Store {
  _id: string;
  name: string;
}

export default function StoreQRCodePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreAndGenerateQR();
  }, [storeId]);

  const fetchStoreAndGenerateQR = async () => {
    try {
      // 店舗情報を取得
      const storeRes = await fetch(`/api/stores/${storeId}`);
      if (!storeRes.ok) throw new Error('店舗が見つかりません');
      const storeData = await storeRes.json();
      setStore(storeData);

      // シンプルな友だち追加URL
      const lineUrl = 'https://line.me/R/ti/p/@2007545466';

      // QRコードを生成
      const qrCodeDataUrl = await QRCode.toDataURL(lineUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);

    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `${store?.name || 'store'}_QRコード.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${store?.name} - 店長登録QRコード</title>
          <style>
            body { 
              font-family: sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 20px; margin-bottom: 20px; }
            .qr-container { margin: 20px 0; }
            .instructions { 
              text-align: left; 
              max-width: 500px; 
              margin: 20px auto;
              line-height: 1.6;
            }
            .store-id { 
              background: #f0f0f0; 
              padding: 10px; 
              border-radius: 5px;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <h1>八丈島親不孝通り</h1>
          <h2>${store?.name} - 店長登録用QRコード</h2>
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QRコード" />
          </div>
          <div class="instructions">
            <h3>使用方法：</h3>
            <ol>
              <li>このQRコードをLINEで読み取る</li>
              <li>友だち追加する</li>
              <li>自動返信されるLINE IDをメモする</li>
              <li>管理者にLINE IDを伝えて登録を依頼</li>
            </ol>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
          <p>読み込み中...</p>
        </div>
      </>
    );
  }

  if (!store) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
          <p>店舗が見つかりません</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 text-gray-900 pt-16">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Link href={`/admin/stores/${storeId}`} className="text-blue-600 hover:underline">
              ← 店舗編集に戻る
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">{store.name} - 店長登録QRコード</h1>

            <div className="text-center mb-6">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QRコード" 
                  className="mx-auto border-2 border-gray-300 p-4 bg-white"
                />
              )}
            </div>

            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={downloadQRCode}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                ダウンロード
              </button>
              <button
                onClick={printQRCode}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                印刷
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <h2 className="font-semibold text-blue-900 mb-2">登録手順</h2>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
                <li>店長にこのQRコードを渡す（印刷推奨）</li>
                <li>LINEアプリでQRコードを読み取って友だち追加</li>
                <li>自動返信されるメッセージに含まれるLINE IDをコピー</li>
                <li>管理画面の「LINE連携管理」でLINE IDと店舗を紐付け</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-semibold text-yellow-900 mb-2">店舗情報</h3>
              <div className="text-sm text-yellow-800">
                <p><strong>店舗名:</strong> {store.name}</p>
                <p><strong>店舗ID:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">{storeId}</code></p>
                <p className="mt-2 text-xs">
                  ※ このIDは店長登録時に必要です
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}