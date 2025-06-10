import mongoose from 'mongoose';

const OfficialPostQueueSchema = new mongoose.Schema({
  sourcePostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostLog',
    required: true
  },
  suggestedTextList: [{
    type: String,
    maxlength: 140
  }],
  approved: {
    type: Boolean,
    default: false
  },
  scheduledAt: {
    type: Date
  },
  posted: {
    type: Boolean,
    default: false
  },
  postedAt: {
    type: Date
  },
  officialTweetIds: [{
    type: String
  }],
  editedBy: {
    type: String
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

export default mongoose.models.OfficialPostQueue || mongoose.model('OfficialPostQueue', OfficialPostQueueSchema);