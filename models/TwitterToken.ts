import mongoose from 'mongoose';

const TwitterTokenSchema = new mongoose.Schema({
  twitterHandle: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  accessToken: {
    type: String,
    required: true
  },
  accessTokenSecret: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountType: {
    type: String,
    enum: ['official', 'store'],
    default: 'store'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  }
});

export default mongoose.models.TwitterToken || mongoose.model('TwitterToken', TwitterTokenSchema);