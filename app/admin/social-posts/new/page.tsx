'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  accountType: 'official' | 'store';
  isActive: boolean;
}

export default function NewSocialPost() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    textList: [''],
    selectedAccounts: [] as string[],
    scheduledAt: '',
    broadcast: false,
    mediaFile: null as File | null,
    mediaPreview: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/twitter-accounts');
      const data = await res.json();
      setAccounts(data.filter((acc: TwitterAccount) => acc.isActive));
    } catch (error) {
      console.error('アカウント取得エラー:', error);
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

  const handleAccountToggle = (accountId: string) => {
    const newSelected = formData.selectedAccounts.includes(accountId)
      ? formData.selectedAccounts.filter(id => id !== accountId)
      : [...formData.selectedAccounts, accountId];
    setFormData({ ...formData, selectedAccounts: newSelected });
  };

  const handleBroadcastToggle = () => {
    if (!formData.broadcast) {
      // 一斉投稿ONの場合、全アカウントを選択
      const allAccountIds = accounts.map(acc => acc._id);
      setFormData({ 
        ...formData, 
        broadcast: true,
        selectedAccounts: allAccountIds 
      });
    } else {
      setFormData({ ...formData, broadcast: false });
    }
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
    
    // バリデーション
    const validTexts = formData.textList.filter(text => text.trim());
    if (validTexts.length === 0) {
      alert('投稿内容を入力してください');
      return;
    }

    if (formData.selectedAccounts.length === 0) {
      alert('投稿先アカウントを選択してください');
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
        accountIds: formData.selectedAccounts,
        scheduledAt: formData.scheduledAt || new Date().toISOString(),
        broadcast: formData.broadcast,
        source: 'official',
        mediaPath,
        mediaType,
        createdBy: 'admin'
      };

      // 投稿作成
      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (!res.ok) throw new Error('投稿の作成に失敗しました');

      alert(formData.scheduledAt ? '投稿を予約しました' : '投稿を作成しました');
      router.push('/admin/social-posts');
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">新規投稿作成</h1>
            <Link
              href="/admin/social-posts"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              投稿一覧へ
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
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
                        placeholder={index === 0 ? "1つ目のツイート（URLは自動で2つ目以降に移動されます）" : `${index + 1}つ目のツイート`}
                      />
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {text.length}/140
                      </div>
                    </div>
                    {formData.textList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTextField(index)}
                        className="text-red-600 hover:text-red-700"
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
                      className="max-w-xs rounded"
                    />
                  ) : (
                    <video 
                      src={formData.mediaPreview} 
                      controls 
                      className="max-w-xs rounded"
                    />
                  )}
                </div>
              )}
            </div>

            {/* 投稿設定 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">投稿設定</h2>
              
              {/* 一斉投稿 */}
              <div className="mb-4 p-4 bg-blue-50 rounded">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.broadcast}
                    onChange={handleBroadcastToggle}
                    className="mr-2"
                  />
                  <span className="font-medium">一斉投稿モード</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  チェックすると、全ての有効なアカウントに同じ内容を投稿します
                </p>
              </div>

              {/* アカウント選択 */}
              <div className="mb-4">
                <label className="block font-medium mb-2">投稿先アカウント</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                  {accounts.map(account => (
                    <label key={account._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.selectedAccounts.includes(account._id)}
                        onChange={() => handleAccountToggle(account._id)}
                        disabled={formData.broadcast}
                        className="mr-2"
                      />
                      <span className={`${account.accountType === 'official' ? 'font-bold' : ''}`}>
                        @{account.twitterHandle} - {account.displayName}
                        {account.accountType === 'official' && ' (統合)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 予約投稿 */}
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
              <Link
                href="/admin/social-posts"
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '処理中...' : (formData.scheduledAt ? '予約する' : '投稿する')}
              </button>
            </div>
          </form>

          {/* 投稿ポリシー */}
          <div className="mt-6 p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">投稿ポリシー</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• URLは自動的に2ツイート目以降に移動されます（インプレッション最適化）</li>
              <li>• 各ツイートは140文字以内に制限されています</li>
              <li>• 画像/動画は1つ目のツイートに添付されます</li>
              <li>• スレッド形式の場合、全てのツイートが連続して投稿されます</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}