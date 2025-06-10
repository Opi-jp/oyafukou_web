'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';

interface Store {
  _id: string;
  name: string;
  staffMembers?: StaffMember[];
}

interface StaffMember {
  lineUserId: string;
  name: string;
  role: string;
  photo?: string;
  isActive: boolean;
  isTemporary?: boolean;
}

export default function StaffRegisterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = params.id as string;
  const lineUserId = searchParams.get('lineUserId');
  const role = searchParams.get('role');

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (!lineUserId || !role) {
      alert('無効なアクセスです。LINEから送られたURLを使用してください。');
      router.push('/');
      return;
    }
    fetchStore();
  }, [lineUserId, role]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}`);
      if (!res.ok) throw new Error('店舗が見つかりません');
      const data = await res.json();
      setStore(data);

      // 該当するスタッフメンバーを探す
      const staffMember = data.staffMembers?.find(
        (member: StaffMember) => member.lineUserId === lineUserId
      );

      if (!staffMember) {
        alert('仮登録情報が見つかりません。もう一度LINEから登録してください。');
        router.push('/');
        return;
      }

      if (!staffMember.isTemporary) {
        alert('既に本登録が完了しています。');
        router.push(`/admin/stores/${storeId}/staff-comments`);
        return;
      }

      // 既存データがあれば設定
      setFormData({
        name: staffMember.name === '未設定' ? '' : staffMember.name,
        photo: staffMember.photo || '',
        phone: '',
        email: ''
      });
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('お名前を入力してください');
      return;
    }

    setSaving(true);

    try {
      // スタッフ情報を更新（本登録）
      const updateData = {
        lineUserId,
        name: formData.name.trim(),
        photo: formData.photo,
        phone: formData.phone,
        email: formData.email,
        isTemporary: false,  // 本登録完了
        isActive: true       // アクティブ化
      };

      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType: 'completeStaffRegistration',
          staffData: updateData
        })
      });

      if (!res.ok) throw new Error('更新に失敗しました');

      alert('登録が完了しました！\nLINEでコメントや写真を送信できるようになりました。');
      router.push(`/admin/stores/${storeId}/staff-comments`);
    } catch (error) {
      console.error('Error:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
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
          <p>エラーが発生しました</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">
              スタッフ本登録
            </h1>

            <div className="mb-6 p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>店舗：</strong>{store.name}<br />
                <strong>役職：</strong>{role}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="山田 太郎"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  プロフィール写真
                </label>
                <ImageUpload
                  currentImage={formData.photo}
                  onImageChange={(url) => setFormData({ ...formData, photo: url })}
                  label="写真をアップロード"
                />
                <p className="text-sm text-gray-600 mt-1">
                  ※LINEから写真を送信して更新することもできます
                </p>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded text-gray-900"
                  placeholder="example@email.com"
                />
              </div>

              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? '保存中...' : '登録を完了する'}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">登録後にできること</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• LINEでテキストを送信 → お店のコメントを更新</li>
                <li>• LINEで写真を送信 → プロフィール写真を更新</li>
                <li>• 複数店舗に所属している場合は、店舗を選択して更新</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}