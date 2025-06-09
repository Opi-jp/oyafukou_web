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
  managerPhoto: {
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
  detailImage1: {
    type: String,
    trim: true
  },
  detailImage2: {
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
  // 臨時休業
  temporaryClosed: {
    type: Boolean,
    default: false
  },
  temporaryClosedReason: {
    type: String,
    trim: true
  },
  // LINE連携
  lineUserId: {
    type: String,
    trim: true,
    sparse: true  // null値を許可し、インデックスに含めない
  },
  lineManagerActive: {
    type: Boolean,
    default: false
  },
  
  // スタッフ管理（複数スタッフ対応）
  staffMembers: [{
    lineUserId: String,
    name: String,
    role: {
      type: String,
      enum: ['店長', 'マネージャー', 'スタッフ', 'アルバイト'],
      default: 'スタッフ'
    },
    photo: String,
    isActive: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // スタッフコメント（承認待ち含む）
  staffComments: [{
    staffLineUserId: String,
    staffName: String,
    staffRole: String,
    staffPhoto: String,
    comment: String,
    isApproved: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 現在表示中のコメント
  activeStaffComment: {
    staffLineUserId: String,
    staffName: String,
    staffRole: String,
    staffPhoto: String,
    comment: String,
    updatedAt: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);