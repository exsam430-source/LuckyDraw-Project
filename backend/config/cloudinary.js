import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Get config from env
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Debug log
console.log('═══ CLOUDINARY CONFIG ═══');
console.log('  Cloud Name:', cloudName || 'NOT SET');
console.log('  API Key:', apiKey ? '✓ Set' : '✗ Missing');
console.log('  API Secret:', apiSecret ? '✓ Set' : '✗ Missing');
console.log('═════════════════════════');

// Test connection
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connected successfully!'))
  .catch((err) => {
    console.error('❌ Cloudinary connection failed!');
    console.error('   Error:', err.error?.message || err.message || 'Unknown error');
    console.error('');
    console.error('   🔧 HOW TO FIX:');
    console.error('   1. Go to: https://console.cloudinary.com/settings/api-keys');
    console.error('   2. Find "API Environment variable"');
    console.error('   3. Copy the part AFTER the @ symbol (your real cloud name)');
    console.error('   4. Update CLOUDINARY_CLOUD_NAME in your .env file');
    console.error('');
    console.error('   Current cloud name in .env:', cloudName);
    console.error('   (This is probably wrong — real cloud names usually start with "d")');
  });

// Storage for payment screenshots
export const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucky-draw/payments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for prize images
export const prizeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucky-draw/prizes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for draw images
export const drawStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucky-draw/draws',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for QR code images
export const qrCodeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucky-draw/qr-codes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
  }
});

// Delete image from cloudinary
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return { success: true };
    
    let idToDelete = publicId;
    if (publicId.includes('cloudinary.com')) {
      const parts = publicId.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1) {
        idToDelete = parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
      }
    }
    
    const result = await cloudinary.uploader.destroy(idToDelete);
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return { success: false, error: error.message };
  }
};

export default cloudinary;