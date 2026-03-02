import mongoose from 'mongoose';

const prizeSchema = new mongoose.Schema({
  draw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Prize title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  prizeType: {
    type: String,
    enum: ['grand', 'secondary', 'consolation'],
    required: true
  },
  value: {
    type: Number,
    required: [true, 'Prize value is required'],
    min: [0, 'Prize value cannot be negative']
  },
  prizeCategory: {
    type: String,
    enum: ['cash', 'item', 'voucher', 'other'],
    default: 'cash'
  },
  image: {
    type: String,
    default: ''
  },
  assignedToken: {
    type: Number,
    default: null,
    select: false  // Hidden from normal queries - admin assigns secretly
  },
  winningToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isAwarded: {
    type: Boolean,
    default: false
  },
  awardedAt: {
    type: Date,
    default: null
  },
  position: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for quick lookup
prizeSchema.index({ draw: 1, prizeType: 1 });

const Prize = mongoose.model('Prize', prizeSchema);
export default Prize;