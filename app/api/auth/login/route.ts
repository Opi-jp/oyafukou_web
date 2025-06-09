import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'

// JWT秘密鍵（本番環境では環境変数から取得）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 入力値のバリデーション
    if (!username || !password) {
      return NextResponse.json(
        { message: 'ユーザー名とパスワードは必須です' },
        { status: 400 }
      )
    }

    // MongoDBに接続
    const uri = process.env.MONGODB_URI!
    const client = new MongoClient(uri)
    await client.connect()
    
    // ユーザーはoyafukou_dbに保存する
    const db = client.db('oyafukou_db')
    const user = await db.collection('users').findOne({ username })

    if (!user) {
      return NextResponse.json(
        { message: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワードを検証
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // JWTトークンを生成
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // 接続を閉じる
    await client.close()

    // ログイン成功
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}