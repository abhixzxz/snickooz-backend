import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100,
    // Required only for group conversations
    required: function() {
      return this.type === 'group';
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure at least 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    next(new Error('Conversation must have at least 2 participants'));
  }
  if (this.type === 'private' && this.participants.length !== 2) {
    next(new Error('Private conversation must have exactly 2 participants'));
  }
  next();
});

// Add indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

// Method to get conversation details
conversationSchema.methods.toConversationInfo = function() {
  const conversationInfo = this.toObject();
  return conversationInfo;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;