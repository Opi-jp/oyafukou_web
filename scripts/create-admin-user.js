const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const readline = require('readline')

// dotenvを読み込み
require('dotenv').config({ path: '.env.local' })

// MongoDB接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oyafukou'

// Userスキーマの定義（TypeScriptのモデルと同じ）
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager'],
    default: 'admin'
  }
}, {
  timestamps: true
})

const User = mongoose.model('User', UserSchema)

// 入力を受け付けるためのインターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 入力を求める関数
const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function createAdminUser() {
  try {
    // MongoDBに接続（oyafukou_dbデータベースを使用）
    const mongoUri = MONGODB_URI.replace(/\/[^/]+\?/, '/oyafukou_db?')
    await mongoose.connect(mongoUri)
    console.log('MongoDBに接続しました（oyafukou_db）')

    // ユーザー名の入力
    const username = await question('管理者ユーザー名を入力してください（3文字以上）: ')
    if (username.length < 3) {
      console.error('ユーザー名は3文字以上である必要があります')
      process.exit(1)
    }

    // 既存ユーザーのチェック
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      console.error('このユーザー名は既に使用されています')
      process.exit(1)
    }

    // パスワードの入力
    const password = await question('パスワードを入力してください（6文字以上）: ')
    if (password.length < 6) {
      console.error('パスワードは6文字以上である必要があります')
      process.exit(1)
    }

    // パスワードの確認
    const confirmPassword = await question('パスワードを再入力してください: ')
    if (password !== confirmPassword) {
      console.error('パスワードが一致しません')
      process.exit(1)
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // ユーザーを作成
    const user = new User({
      username,
      password: hashedPassword,
      role: 'admin'
    })

    await user.save()
    console.log(`\n✅ 管理者ユーザー「${username}」を作成しました`)
    console.log('ログイン画面（/login）からログインできます')

  } catch (error) {
    console.error('エラーが発生しました:', error.message)
  } finally {
    rl.close()
    await mongoose.disconnect()
  }
}

// スクリプトの実行
console.log('=== 親不孝通り 管理者ユーザー作成スクリプト ===\n')
createAdminUser()