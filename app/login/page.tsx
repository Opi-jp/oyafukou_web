'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // ログイン成功
        localStorage.setItem('token', data.token)
        // Cookieにもトークンを設定（middlewareで使用）
        document.cookie = `auth-token=${data.token}; path=/; max-age=86400`
        router.push('/admin')
      } else {
        setError(data.message || 'ログインに失敗しました')
      }
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">管理者ログイン</h1>
            
            <div className="bg-[#1A1A1A] rounded-lg p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-[#FF6B4A] focus:outline-none transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    パスワード
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-[#FF6B4A] focus:outline-none transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FF6B4A] hover:bg-[#ff5a35] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'ログイン中...' : 'ログイン'}
                </button>
              </form>
            </div>

            <p className="text-center text-gray-400 text-sm mt-6">
              管理者のみアクセス可能です
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}