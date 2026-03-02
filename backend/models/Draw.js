import mongoose from 'mongoose';

const drawSchema = new mongoose.Schema({
  drawName: {
    type: String,
    required: [true, 'Draw name is required'],
    trim: true,
    maxlength: [100, 'Draw name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Draw description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  totalTokens: {
    type: Number,
    required: [true, 'Total tokens is required'],
    min: [10, 'Minimum 10 tokens required'],
    max: [10000, 'Maximum 10000 tokens allowed']
  },
  tokenPrice: {
    type: Number,
    required: [true, 'Token price is required'],
    min: [1, 'Minimum token price is 1']
  },
  maxTokensPerUser: {
    type: Number,
    required: [true, 'Max tokens per user is required'],
    min: [1, 'Minimum 1 token per user'],
    default: 10
  },
  tokensSold: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  grandPrize: {
    title: { type: String, required: true },
    description: { type: String },
    value: { type: Number, required: true },
    image: { type: String, default: '' }
  },
  drawExecutedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAutoClose: {
    type: Boolean,
    default: true
  },
  // NEW — live draw support
  isLive: {
    type: Boolean,
    default: false
  },
  drawnHistory: [{
    tokenNumber: { type: Number, required: true },
    prize: { type: mongoose.Schema.Types.ObjectId, ref: 'Prize', default: null },
    prizeTitle: { type: String, default: '' },
    prizeValue: { type: Number, default: 0 },
    hasPrize: { type: Boolean, default: false },
    isSold: { type: Boolean, default: false },
    buyerName: { type: String, default: '' },
    drawnAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

drawSchema.virtual('remainingTokens').get(function () {
  return this.totalTokens - this.tokensSold;
});

drawSchema.virtual('isFull').get(function () {
  return this.tokensSold >= this.totalTokens;
});

drawSchema.pre('save', function () {
  const now = new Date();
  if (this.status !== 'completed' && this.status !== 'cancelled') {
    if (now < this.startDate) {
      this.status = 'upcoming';
    } else if (now >= this.startDate && now <= this.endDate && !this.isFull) {
      this.status = 'active';
    }
  }
  if (this.isAutoClose && this.tokensSold >= this.totalTokens && this.status === 'active') {
    this.status = 'completed';
  }
});

drawSchema.set('toJSON', { virtuals: true });
drawSchema.set('toObject', { virtuals: true });

const Draw = mongoose.model('Draw', drawSchema);
export default Draw;