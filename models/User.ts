import mongoose from 'mongoose'

export interface IUser {
  _id?: string
  username: string
  password: string
  role: 'admin' | 'manager'
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new mongoose.Schema<IUser>({
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

// インデックスの作成
UserSchema.index({ username: 1 })

// 既存のモデルがあれば削除してから再作成
if (mongoose.models.User) {
  delete mongoose.models.User
}

export default mongoose.model<IUser>('User', UserSchema)