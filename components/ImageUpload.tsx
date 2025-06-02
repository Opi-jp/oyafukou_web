'use client';

import { useState, useEffect } from 'react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  circular?: boolean;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = 'URLを入力するか画像をアップロード',
  circular = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (value) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'アップロードに失敗しました');
      }

      if (data.url) {
        console.log('Setting image URL:', data.url);
        onChange(data.url);
      } else {
        throw new Error('URLが返されませんでした');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={uploading}
        />
        <label className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer flex items-center">
          {uploading ? 'アップロード中...' : '画像を選択'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      
      {value && (
        <>
          <div className={`mt-2 ${circular ? 'w-32 h-32' : 'w-48 h-32'} overflow-hidden ${circular ? 'rounded-full border-4 border-blue-500' : 'rounded'} bg-gray-100 relative`}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">読み込み中...</span>
              </div>
            )}
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <span className="text-red-500 text-sm text-center px-2">画像を読み込めません</span>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={value} 
                  alt="プレビュー"
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('Image loaded successfully:', value);
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', value);
                    console.error('Error details:', e);
                    // ブラウザコンソールに詳細情報を出力
                    if (typeof window !== 'undefined') {
                      console.error('Window location:', window.location.href);
                      console.error('Image element:', e.currentTarget);
                    }
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 break-all">
            URL: {value}
          </div>
        </>
      )}
    </div>
  );
}