import mongoose from 'mongoose';

const ScheduledPostSchema = new mongoose.Schema({
  textList: [{
    type: String,
    maxlength: [140, '各ツイートは140文字以内にしてください']
  }],
  imagePath: {
    type: String,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'none'],
    default: 'none'
  },
  accountIds: [{
    type: String,
    required: true
  }],
  scheduledAt: {
    type: Date,
    required: true
  },
  broadcast: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['official', 'store', 'staff'],
    default: 'staff'
  },
  status: {
    type: String,
    enum: ['pending', 'posted', 'failed'],
    default: 'pending'
  },
  error: {
    type: String,
    trim: true
  },
  postedTweetIds: [{
    accountId: String,
    tweetIds: [String]
  }],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.ScheduledPost || mongoose.model('ScheduledPost', ScheduledPostSchema);