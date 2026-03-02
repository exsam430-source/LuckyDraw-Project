import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  draw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash'],
    required: [true, 'Payment method is required']
  },
  transactionId: {
    type: String,
    trim: true,
    default: ''
  },
  numberOfTokens: {
    type: Number,
    required: [true, 'Number of tokens is required'],
    min: [1, 'Minimum 1 token required']
  },
  tokenPrice: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  referralPointsUsed: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  screenshotUrl: {
    type: String,
    default: ''
    // Removed required — cleanup service clears this after draw completion
  },
  screenshotPublicId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  tokensAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token'
  }],
  receiptNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate receipt number before saving
paymentSchema.pre('save', function () {
  if (!this.receiptNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.receiptNumber = `RCP-${timestamp}-${random}`;
  }
});

// Calculate total amount
paymentSchema.pre('save', function () {
  if (this.isModified('numberOfTokens') || this.isModified('tokenPrice')) {
    this.totalAmount = this.numberOfTokens * this.tokenPrice;
    this.finalAmount = this.totalAmount - this.discountApplied;
  }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;