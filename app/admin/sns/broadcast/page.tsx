'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TwitterAccount {
  _id: string;
  twitterHandle: string;
  displayName: string;
  storeId?: string;
  storeName?: string;
  isActive: boolean;
}

interface PostTemplate {
  _id: string;
  textList: string[];
  mediaType: string;
  mediaPath?: string;
  sourceAccount: string;
  createdAt: Date;
}

export default function BroadcastPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    textList: [''],
    selectedAccounts: [] as string[],
    scheduledAt: '',
    mediaFile: null as File | null,
    mediaPreview: ''
  });

  useEffect(() => {
    fetchData();
    
    // ローカルストレージから再利用データを読み込み
    const reuseData = localStorage.getItem('reusePost');
    if (reuseData) {
      const { textList } = JSON.parse(reuseData);
      setFormData(prev => ({ ...prev, textList }));
      localStorage.removeItem('reusePost');
    }
  }, []);

  const fetchData = async () => {
    try {
      // アカウント一覧を取得
      const accountsRes = await fetch('/api/twitter-accounts');
      const accountsData = await accountsRes.json();
      setAccounts(accountsData.filter((acc: TwitterAccount) => acc.isActive));

      // 投稿テンプレート（履歴）を取得
      const templatesRes = await fetch('/api/post-log?limit=5');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData);
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

  const handleAccountToggle = (accountId: string) => {
    const newSelected = formData.selectedAccounts.includes(accountId)
      ? formData.selectedAccounts.filter(id => id !== accountId)
      : [...formData.selectedAccounts, accountId];
    setFormData({ ...formData, selectedAccounts: newSelected });
  };

  const handleSelectAll = () => {
    const allAccountIds = accounts.map(acc => acc._id);
    setFormData({ ...formData, selectedAccounts: allAccountIds });
  };

  const handleDeselectAll = () => {
    setFormData({ ...formData, selectedAccounts: [] });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const loadTemplate = (template: PostTemplate) => {
    setFormData({
      ...formData,
      textList: template.textList
    });
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
        broadcast: true,
        source: 'admin',
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

      // OfficialPostQueueにも保存（再利用のため）
      await fetch('/api/official-post-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `一斉投稿 ${new Date().toLocaleDateString('ja-JP')}`,
          textList: validTexts,
          mediaType,
          mediaPath,
          tags: ['broadcast']
        })
      });

      alert(formData.scheduledAt ? '投稿を予約しました' : '投稿を送信しました');
      router.push('/admin/sns');
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">一斉投稿</h1>
          <Link href="/admin/sns" className="text-blue-400 hover:underline">
            ← SNS管理に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* 左側：投稿内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 投稿内容 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">投稿内容</h2>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">画像/動画（任意）</h2>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">投稿設定</h2>
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
          </div>

          {/* 右側：アカウント選択とテンプレート */}
          <div className="space-y-6">
            {/* アカウント選択 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">投稿先アカウント</h2>
                <div className="text-sm space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:underline"
                  >
                    全選択
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-blue-600 hover:underline"
                  >
                    全解除
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accounts.map((account) => (
                  <label key={account._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedAccounts.includes(account._id)}
                      onChange={() => handleAccountToggle(account._id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">@{account.twitterHandle}</p>
                      {account.storeName && (
                        <p className="text-xs text-gray-500">{account.storeName}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                選択中: {formData.selectedAccounts.length}件
              </p>
            </div>

            {/* テンプレート */}
            {templates.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">最近の投稿から選択</h2>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template._id}
                      type="button"
                      onClick={() => loadTemplate(template)}
                      className="w-full text-left p-3 border rounded hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium line-clamp-2">
                        {template.textList[0]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(template.createdAt).toLocaleDateString('ja-JP')}
                        {template.textList.length > 1 && ` (+${template.textList.length - 1}件)`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-bold"
              >
                {loading ? '処理中...' : (formData.scheduledAt ? '予約投稿' : '今すぐ投稿')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}