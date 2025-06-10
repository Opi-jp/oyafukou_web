'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Store {
  _id: string;
  name: string;
}

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  storeId: string;
}

export default function StorePostPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [account, setAccount] = useState<TwitterAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    textList: [''],
    scheduledAt: '',
    mediaFile: null as File | null,
    mediaPreview: ''
  });

  useEffect(() => {
    fetchStoreAndAccount();
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStoreAndAccount = async () => {
    try {
      // 店舗情報を取得
      const storeRes = await fetch(`/api/stores/${storeId}`);
      const storeData = await storeRes.json();
      setStore(storeData);
      
      // 店舗に紐づくXアカウントを取得
      const accountsRes = await fetch('/api/twitter-accounts');
      const accountsData = await accountsRes.json();
      const storeAccount = accountsData.find(
        (acc: TwitterAccount) => acc.storeId === storeId
      );
      setAccount(storeAccount);
    } catch (error) {
      console.error('データ取得エラー:', error);
    }
  };

  const handleTextChange = (index: number, value: string) => {
    const newTextList = [...formData.textList];
    newTextList[index] = value;
    setFormData({ ...formData, textList: newTextList });
  };

  const addTextField = () => {
    setFormData({ ...formData, textList: [...formData.textList, ''] });
  };

  const removeTextField = (index: number) => {
    const newTextList = formData.textList.filter((_, i) => i !== index);
    setFormData({ ...formData, textList: newTextList });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ 
        ...formData, 
        mediaFile: file,
        mediaPreview: reader.result as string 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      alert('この店舗にはXアカウントが設定されていません');
      return;
    }
    
    // バリデーション
    const validTexts = formData.textList.filter(text => text.trim());
    if (validTexts.length === 0) {
      alert('投稿内容を入力してください');
      return;
    }

    // 140文字チェック
    for (const text of validTexts) {
      if (text.length > 140) {
        alert('各ツイートは140文字以内にしてください');
        return;
      }
    }

    setLoading(true);

    try {
      // メディアアップロード
      let mediaPath = '';
      let mediaType = 'none';
      
      if (formData.mediaFile) {
        const uploadData = new FormData();
        uploadData.append('file', formData.mediaFile);
        
        const uploadRes = await fetch('/api/upload-media', {
          method: 'POST',
          body: uploadData
        });
        
        if (!uploadRes.ok) throw new Error('メディアアップロードに失敗しました');
        
        const uploadResult = await uploadRes.json();
        mediaPath = uploadResult.url;
        mediaType = uploadResult.mediaType;
      }

      // 投稿データ作成
      const postData = {
        textList: validTexts,
        accountIds: [account._id],
        scheduledAt: formData.scheduledAt || new Date().toISOString(),
        broadcast: false,
        source: 'store',
        mediaPath,
        mediaType,
        createdBy: `store_${storeId}`
      };

      // 投稿作成
      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (!res.ok) throw new Error('投稿の作成に失敗しました');

      // PostLogにも記録（再利用のため）
      await fetch('/api/post-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textList: validTexts,
          mediaType,
          mediaPath,
          sourceAccount: `@${account.twitterHandle}`,
          storeId
        })
      });

      alert(formData.scheduledAt ? '投稿を予約しました' : '投稿を送信しました');
      
      // フォームをリセット
      setFormData({
        textList: [''],
        scheduledAt: '',
        mediaFile: null,
        mediaPreview: ''
      });
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!store) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
          <p>読み込み中...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              X(Twitter)投稿
            </h1>
            <p className="text-gray-600">{store.name}</p>
            {account && (
              <p className="text-sm text-gray-500 mt-1">
                投稿先: @{account.twitterHandle}
              </p>
            )}
          </div>

          {!account ? (
            <div className="bg-yellow-50 p-4 rounded">
              <p className="text-yellow-800">
                この店舗にはXアカウントが設定されていません。
                管理者にお問い合わせください。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6">
              {/* 投稿内容 */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">投稿内容</h2>
                {formData.textList.map((text, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <textarea
                          value={text}
                          onChange={(e) => handleTextChange(index, e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder={index === 0 ? "投稿内容を入力" : `${index + 1}つ目のツイート（返信）`}
                        />
                        <div className="text-sm text-gray-500 text-right mt-1">
                          {text.length}/140
                        </div>
                      </div>
                      {formData.textList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTextField(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTextField}
                  className="text-blue-600 hover:underline text-sm"
                >
                  + ツイートを追加（スレッド形式）
                </button>
              </div>

              {/* メディア */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">画像/動画（任意）</h2>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,video/mp4"
                  onChange={handleFileChange}
                  className="mb-2"
                />
                {formData.mediaPreview && (
                  <div className="mt-4">
                    {formData.mediaFile?.type.startsWith('image/') ? (
                      <img 
                        src={formData.mediaPreview} 
                        alt="プレビュー" 
                        className="max-w-full sm:max-w-xs rounded"
                      />
                    ) : (
                      <video 
                        src={formData.mediaPreview} 
                        controls 
                        className="max-w-full sm:max-w-xs rounded"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 予約投稿 */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">投稿設定</h2>
                <div>
                  <label className="block font-medium mb-2">投稿日時（空欄で即時投稿）</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '処理中...' : (formData.scheduledAt ? '予約する' : '投稿する')}
                </button>
              </div>
            </form>
          )}

          {/* 投稿ポリシー */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">投稿のヒント</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 各ツイートは140文字以内で入力してください</li>
              <li>• URLは自動的に2ツイート目以降に移動されます</li>
              <li>• 画像/動画は1つ目のツイートに添付されます</li>
              <li>• スレッド形式で複数のツイートを連続投稿できます</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}