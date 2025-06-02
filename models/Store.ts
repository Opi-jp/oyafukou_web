import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: String,
  isRecommended: {
    type: Boolean,
    default: false
  }
});

// カテゴリ別メニューアイテムスキーマ
const CategoryMenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '店舗名は必須です'],
    trim: true,
    maxlength: [50, '店舗名は50文字以内にしてください']
  },
  category: {
    type: String,
    required: [true, 'カテゴリーは必須です'],
    trim: true
  },
  description: {
    type: String,
    required: [true, '説明は必須です'],
    trim: true,
    maxlength: [500, '説明は500文字以内にしてください']
  },
  openingHours: {
    type: String,
    required: true,
    trim: true
  },
  closedDays: {
    type: [String],
    default: []
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: [true, '住所は必須です'],
    trim: true
  },
  // おすすめメニュー（写真と説明付き）
  menuHighlights: {
    type: [MenuItemSchema],
    default: []
  },
  // 通常メニュー（カテゴリ分け）
  regularMenu: {
    type: [CategoryMenuItemSchema],
    default: []
  },
  // ドリンクメニュー（カテゴリ分け）
  drinkMenu: {
    type: [CategoryMenuItemSchema],
    default: []
  },
  // 店長情報
  managerName: {
    type: String,
    trim: true
  },
  managerComment: {
    type: String,
    trim: true,
    maxlength: [1000, '店長コメントは1000文字以内にしてください']
  },
  // 画像管理
  topImage: {
    type: String,
    trim: true
  },
  exteriorImage: {
    type: String,
    trim: true
  },
  images: {
    type: [String],
    default: []
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);