import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending'
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  firstPurchasePayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate referrals
referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);
export default Referral;