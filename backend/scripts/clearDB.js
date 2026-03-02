import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Models
import User from '../models/User.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Payment from '../models/Payment.js';
import Prize from '../models/Prize.js';
import Referral from '../models/Referral.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    console.log('🗑️  Clearing all collections...');
    
    await User.deleteMany({});
    console.log('   ✓ Users cleared');
    
    await Draw.deleteMany({});
    console.log('   ✓ Draws cleared');
    
    await Token.deleteMany({});
    console.log('   ✓ Tokens cleared');
    
    await Payment.deleteMany({});
    console.log('   ✓ Payments cleared');
    
    await Prize.deleteMany({});
    console.log('   ✓ Prizes cleared');
    
    await Referral.deleteMany({});
    console.log('   ✓ Referrals cleared');

    console.log('\n✅ Database cleared successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearDatabase();