import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: Number,
    required: [true, 'Token number is required']
  },
  draw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'won', 'lost'],
    default: 'active'
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    default: null
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index - each token number unique per draw
tokenSchema.index({ tokenNumber: 1, draw: 1 }, { unique: true });

// Index for quick user token lookup
tokenSchema.index({ user: 1, draw: 1 });

const Token = mongoose.model('Token', tokenSchema);
export default Token;