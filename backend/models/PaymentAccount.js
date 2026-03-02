import mongoose from 'mongoose';

const paymentAccountSchema = new mongoose.Schema({
  accountType: {
    type: String,
    enum: ['easypaisa', 'jazzcash'],
    required: [true, 'Account type is required']
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true
  },
  qrCode: {
    type: String,
    default: ''
  },
  qrCodePublicId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const PaymentAccount = mongoose.model('PaymentAccount', paymentAccountSchema);
export default PaymentAccount;