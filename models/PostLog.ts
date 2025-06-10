import mongoose from 'mongoose';

const PostLogSchema = new mongoose.Schema({
  textList: [{
    type: String,
    required: true
  }],
  mediaType: {
    type: String,
    enum: ['image', 'video', 'none'],
    default: 'none'
  },
  mediaPath: {
    type: String,
    trim: true
  },
  sourceAccount: {
    type: String,
    required: true
  },
  tweetIds: [{
    type: String
  }],
  threadUrl: {
    type: String
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  impressions: {
    type: Number,
    default: 0
  },
  engagements: {
    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    replies: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.PostLog || mongoose.model('PostLog', PostLogSchema);