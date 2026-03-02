import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@luckydraw.com' });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin already exists!');
      console.log('----------------------------');
      console.log('Email: admin@luckydraw.com');
      console.log('Password: admin123');
      console.log('----------------------------\n');
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      fullName: 'Super Admin',
      email: 'admin@luckydraw.com',
      contactNumber: '03001234567',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true,
      currentLocation: {
        city: 'Lahore',
        province: 'Punjab',
        country: 'Pakistan'
      }
    });

    console.log('\n✅ Admin created successfully!');
    console.log('----------------------------');
    console.log('Email: admin@luckydraw.com');
    console.log('Password: admin123');
    console.log('----------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();