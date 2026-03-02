import 'dotenv/config';
import mongoose from 'mongoose';

// Models
import User from '../models/User.js';
import Draw from '../models/Draw.js';
import Token from '../models/Token.js';
import Payment from '../models/Payment.js';
import Prize from '../models/Prize.js';
import Referral from '../models/Referral.js';
import PaymentAccount from '../models/PaymentAccount.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Clear all collections
const clearDatabase = async () => {
  console.log('🗑️  Clearing database...');
  await User.deleteMany({});
  await Draw.deleteMany({});
  await Token.deleteMany({});
  await Payment.deleteMany({});
  await Prize.deleteMany({});
  await Referral.deleteMany({});
  await PaymentAccount.deleteMany({});
  console.log('✅ Database cleared');
};

// Create Admin User
const createAdmin = async () => {
  console.log('👨‍💼 Creating admin user...');

  const admin = await User.create({
    fullName: 'Super Admin',
    email: 'sam@gmail.com',
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

  console.log('✅ Admin created:', admin.email);
  return admin;
};

// Create Sample Users
const createUsers = async () => {
  console.log('👥 Creating sample users...');

  const users = [];
  const usersData = [
    {
      fullName: 'Ahmed Khan',
      email: 'ahmed@example.com',
      contactNumber: '03011111111',
      password: 'user123',
      city: 'Karachi',
      province: 'Sindh'
    },
    {
      fullName: 'Sara Ali',
      email: 'sara@example.com',
      contactNumber: '03022222222',
      password: 'user123',
      city: 'Islamabad',
      province: 'Islamabad'
    },
    {
      fullName: 'Bilal Ahmed',
      email: 'bilal@example.com',
      contactNumber: '03033333333',
      password: 'user123',
      city: 'Lahore',
      province: 'Punjab'
    },
    {
      fullName: 'Fatima Zahra',
      email: 'fatima@example.com',
      contactNumber: '03044444444',
      password: 'user123',
      city: 'Peshawar',
      province: 'KPK'
    },
    {
      fullName: 'Usman Malik',
      email: 'usman@example.com',
      contactNumber: '03055555555',
      password: 'user123',
      city: 'Multan',
      province: 'Punjab'
    },
    {
      fullName: 'Ayesha Siddiqui',
      email: 'ayesha@example.com',
      contactNumber: '03066666666',
      password: 'user123',
      city: 'Faisalabad',
      province: 'Punjab'
    },
    {
      fullName: 'Hassan Raza',
      email: 'hassan@example.com',
      contactNumber: '03077777777',
      password: 'user123',
      city: 'Rawalpindi',
      province: 'Punjab'
    },
    {
      fullName: 'Zainab Noor',
      email: 'zainab@example.com',
      contactNumber: '03088888888',
      password: 'user123',
      city: 'Quetta',
      province: 'Balochistan'
    },
    {
      fullName: 'Ali Hussain',
      email: 'ali@example.com',
      contactNumber: '03099999999',
      password: 'user123',
      city: 'Sialkot',
      province: 'Punjab'
    },
    {
      fullName: 'Maryam Khan',
      email: 'maryam@example.com',
      contactNumber: '03101010101',
      password: 'user123',
      city: 'Gujranwala',
      province: 'Punjab'
    }
  ];

  for (const userData of usersData) {
    const user = await User.create({
      fullName: userData.fullName,
      email: userData.email,
      contactNumber: userData.contactNumber,
      password: userData.password,
      role: 'user',
      isVerified: true,
      isActive: true,
      currentLocation: {
        city: userData.city,
        province: userData.province,
        country: 'Pakistan'
      },
      referralPoints: Math.floor(Math.random() * 500)
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
};

// Create Global Payment Accounts
const createPaymentAccounts = async () => {
  console.log('🏦 Creating payment accounts...');

  const accounts = [];

  // EasyPaisa Primary
  const ep1 = await PaymentAccount.create({
    accountType: 'easypaisa',
    accountName: 'Lucky Draw Official',
    accountNumber: '03001234567',
    isActive: true,
    isPrimary: true
  });
  accounts.push(ep1);

  // EasyPaisa Secondary
  const ep2 = await PaymentAccount.create({
    accountType: 'easypaisa',
    accountName: 'Lucky Draw Backup',
    accountNumber: '03009876543',
    isActive: true,
    isPrimary: false
  });
  accounts.push(ep2);

  // JazzCash Primary
  const jc1 = await PaymentAccount.create({
    accountType: 'jazzcash',
    accountName: 'Lucky Draw JazzCash',
    accountNumber: '03111234567',
    isActive: true,
    isPrimary: false
  });
  accounts.push(jc1);

  // JazzCash Secondary (inactive)
  const jc2 = await PaymentAccount.create({
    accountType: 'jazzcash',
    accountName: 'Lucky Draw JazzCash Old',
    accountNumber: '03119876543',
    isActive: false,
    isPrimary: false
  });
  accounts.push(jc2);

  console.log(`✅ Created ${accounts.length} payment accounts`);
  return accounts;
};

// Create Sample Draws
const createDraws = async (adminId) => {
  console.log('🎰 Creating sample draws...');

  const draws = [];
  const now = new Date();

  const drawsData = [
    {
      drawName: 'New Year Mega Draw 2024',
      description: 'Win amazing prizes in our New Year special draw! Grand prize is a brand new Honda City car.',
      totalTokens: 1000,
      tokenPrice: 500,
      maxTokensPerUser: 20,
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      status: 'active',
      grandPrize: {
        title: 'Honda City 2024',
        description: 'Brand new Honda City 1.5L Aspire CVT',
        value: 5500000
      }
    },
    {
      drawName: 'Weekly Lucky Draw #45',
      description: "Every week a chance to win! This week's prize is iPhone 15 Pro Max.",
      totalTokens: 500,
      tokenPrice: 200,
      maxTokensPerUser: 10,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'active',
      grandPrize: {
        title: 'iPhone 15 Pro Max 256GB',
        description: 'Latest Apple iPhone 15 Pro Max with warranty',
        value: 550000
      }
    },
    {
      drawName: 'Eid Special Draw',
      description: 'Celebrate Eid with exciting prizes! Multiple winners every draw.',
      totalTokens: 2000,
      tokenPrice: 300,
      maxTokensPerUser: 30,
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      grandPrize: {
        title: 'Cash Prize Rs 1,000,000',
        description: 'One million rupees cash prize',
        value: 1000000
      }
    },
    {
      drawName: 'Winter Special Draw',
      description: 'Win winter goodies and electronics!',
      totalTokens: 300,
      tokenPrice: 150,
      maxTokensPerUser: 5,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: 'completed',
      grandPrize: {
        title: 'Samsung 55" Smart TV',
        description: 'Samsung Crystal UHD 4K Smart TV',
        value: 180000
      },
      drawExecutedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      drawName: 'Tech Lovers Draw',
      description: 'For all tech enthusiasts! Win the latest gadgets.',
      totalTokens: 800,
      tokenPrice: 400,
      maxTokensPerUser: 15,
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      grandPrize: {
        title: 'MacBook Pro 14" M3',
        description: 'Apple MacBook Pro 14 inch with M3 chip',
        value: 850000
      }
    }
  ];

  for (const drawData of drawsData) {
    const draw = await Draw.create({
      ...drawData,
      createdBy: adminId,
      tokensSold: 0
    });
    draws.push(draw);
  }

  console.log(`✅ Created ${draws.length} draws`);
  return draws;
};

// Create Prizes for Draws
const createPrizes = async (draws) => {
  console.log('🏆 Creating prizes...');

  const allPrizes = [];

  for (const draw of draws) {
    // Grand Prize
    const grandPrize = await Prize.create({
      draw: draw._id,
      title: draw.grandPrize.title,
      description: draw.grandPrize.description,
      prizeType: 'grand',
      value: draw.grandPrize.value,
      prizeCategory: draw.grandPrize.value >= 1000000 ? 'cash' : 'item',
      position: 1
    });
    allPrizes.push(grandPrize);

    // Secondary Prizes
    const secondaryPrizes = [
      { title: 'Smart Watch', value: 50000 },
      { title: 'Wireless Earbuds', value: 25000 },
      { title: 'Power Bank 20000mAh', value: 8000 }
    ];

    for (let i = 0; i < secondaryPrizes.length; i++) {
      const prize = await Prize.create({
        draw: draw._id,
        title: secondaryPrizes[i].title,
        description: `Win a ${secondaryPrizes[i].title}`,
        prizeType: 'secondary',
        value: secondaryPrizes[i].value,
        prizeCategory: 'item',
        position: i + 2
      });
      allPrizes.push(prize);
    }

    // Consolation Prizes
    for (let i = 0; i < 5; i++) {
      const prize = await Prize.create({
        draw: draw._id,
        title: `Rs ${(i + 1) * 1000} Cash`,
        description: 'Consolation cash prize',
        prizeType: 'consolation',
        value: (i + 1) * 1000,
        prizeCategory: 'cash',
        position: 10 + i
      });
      allPrizes.push(prize);
    }
  }

  console.log(`✅ Created ${allPrizes.length} prizes`);
  return allPrizes;
};

// Create Sample Payments and Tokens
const createPaymentsAndTokens = async (users, draws, adminId) => {
  console.log('💳 Creating payments and tokens...');

  const payments = [];
  const tokens = [];

  const activeDraws = draws.filter(d => d.status === 'active' || d.status === 'completed');

  for (const draw of activeDraws) {
    const usersForDraw = users.slice(0, Math.floor(Math.random() * users.length) + 3);
    let tokenCounter = 1;

    for (const user of usersForDraw) {
      const numberOfTokens = Math.floor(Math.random() * 5) + 1;
      const totalAmount = numberOfTokens * draw.tokenPrice;

      const payment = await Payment.create({
        user: user._id,
        draw: draw._id,
        paymentMethod: Math.random() > 0.5 ? 'easypaisa' : 'jazzcash',
        transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 11)}`.toUpperCase(),
        numberOfTokens,
        tokenPrice: draw.tokenPrice,
        totalAmount,
        discountApplied: 0,
        referralPointsUsed: 0,
        finalAmount: totalAmount,
        screenshotUrl: draw.status === 'completed' ? '' : 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        screenshotPublicId: '',
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date()
      });
      payments.push(payment);

      const userTokenIds = [];
      for (let i = 0; i < numberOfTokens; i++) {
        const token = await Token.create({
          tokenNumber: tokenCounter++,
          draw: draw._id,
          user: user._id,
          payment: payment._id,
          price: draw.tokenPrice,
          status: draw.status === 'completed' ? 'lost' : 'active'
        });
        tokens.push(token);
        userTokenIds.push(token._id);
      }

      payment.tokensAssigned = userTokenIds;
      await payment.save();

      draw.tokensSold += numberOfTokens;
    }

    await draw.save();
  }

  console.log(`✅ Created ${payments.length} payments`);
  console.log(`✅ Created ${tokens.length} tokens`);
  return { payments, tokens };
};

// Create Sample Referrals
const createReferrals = async (users) => {
  console.log('🔗 Creating referrals...');

  const referrals = [];

  for (let i = 1; i < users.length; i += 2) {
    if (i + 1 < users.length) {
      const referral = await Referral.create({
        referrer: users[i]._id,
        referred: users[i + 1]._id,
        referralCode: users[i].referralCode,
        status: 'rewarded',
        pointsAwarded: 100,
        completedAt: new Date()
      });
      referrals.push(referral);

      users[i].referralPoints += 100;
      users[i].totalReferrals += 1;
      await users[i].save();
    }
  }

  console.log(`✅ Created ${referrals.length} referrals`);
  return referrals;
};

// Create Pending Payments for Testing
const createPendingPayments = async (users, draws) => {
  console.log('⏳ Creating pending payments for testing...');

  const pendingPayments = [];
  const activeDraw = draws.find(d => d.status === 'active');

  if (!activeDraw) return pendingPayments;

  for (let i = 0; i < 5 && i < users.length; i++) {
    const numberOfTokens = Math.floor(Math.random() * 3) + 1;
    const totalAmount = numberOfTokens * activeDraw.tokenPrice;

    const payment = await Payment.create({
      user: users[i]._id,
      draw: activeDraw._id,
      paymentMethod: Math.random() > 0.5 ? 'easypaisa' : 'jazzcash',
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 11)}`.toUpperCase(),
      numberOfTokens,
      tokenPrice: activeDraw.tokenPrice,
      totalAmount,
      discountApplied: 0,
      referralPointsUsed: 0,
      finalAmount: totalAmount,
      screenshotUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      screenshotPublicId: '',
      status: 'pending'
    });
    pendingPayments.push(payment);
  }

  console.log(`✅ Created ${pendingPayments.length} pending payments`);
  return pendingPayments;
};

// Assign Winning Tokens to Prizes (for completed draw)
const assignWinningTokens = async (draws, tokens, prizes) => {
  console.log('🎯 Assigning winning tokens...');

  const completedDraw = draws.find(d => d.status === 'completed');
  if (!completedDraw) {
    console.log('⚠️  No completed draw found — skipping winner assignment');
    return;
  }

  const drawTokens = tokens.filter(
    t => t.draw.toString() === completedDraw._id.toString()
  );
  const drawPrizes = prizes.filter(
    p => p.draw.toString() === completedDraw._id.toString()
  );

  if (drawTokens.length === 0) {
    console.log('⚠️  No tokens for completed draw — skipping');
    return;
  }

  // Track used tokens to prevent duplicate assignment
  const usedTokenIndices = new Set();

  // Assign first 3 prizes (grand + 2 secondary)
  const prizesToAssign = drawPrizes.slice(0, Math.min(3, drawPrizes.length));

  for (const prize of prizesToAssign) {
    // Pick a random token that hasn't been used yet
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * drawTokens.length);
      attempts++;
    } while (usedTokenIndices.has(randomIndex) && attempts < drawTokens.length);

    if (usedTokenIndices.has(randomIndex)) continue;
    usedTokenIndices.add(randomIndex);

    const winningToken = drawTokens[randomIndex];

    // Update prize
    prize.assignedToken = winningToken.tokenNumber;
    prize.winningToken = winningToken._id;
    prize.winner = winningToken.user;
    prize.isAwarded = true;
    prize.awardedAt = new Date();
    await prize.save();

    // Update token
    winningToken.isWinner = true;
    winningToken.status = 'won';
    winningToken.prize = prize._id;
    await winningToken.save();
  }

  console.log(`✅ Assigned ${usedTokenIndices.size} winning tokens`);
};

// Assign secret tokens to active draw prizes (for testing draw execution)
const assignSecretTokens = async (draws, prizes) => {
  console.log('🔒 Assigning secret tokens to active draw prizes...');

  const activeDraw = draws.find(d => d.status === 'active');
  if (!activeDraw) {
    console.log('⚠️  No active draw — skipping secret token assignment');
    return;
  }

  const drawPrizes = prizes.filter(
    p => p.draw.toString() === activeDraw._id.toString()
  );

  // Only assign to first few prizes for testing
  const usedNumbers = new Set();
  const prizesToAssign = drawPrizes.slice(0, Math.min(5, drawPrizes.length));

  for (const prize of prizesToAssign) {
    let tokenNumber;
    do {
      tokenNumber = Math.floor(Math.random() * activeDraw.totalTokens) + 1;
    } while (usedNumbers.has(tokenNumber));

    usedNumbers.add(tokenNumber);

    await Prize.findByIdAndUpdate(prize._id, {
      assignedToken: tokenNumber
    });
  }

  console.log(`✅ Assigned ${usedNumbers.size} secret tokens to active draw prizes`);
};

// Main Seeder Function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🚀 Starting database seeding...\n');

    // Clear existing data
    await clearDatabase();

    // Create data
    const admin = await createAdmin();
    const users = await createUsers();
    const paymentAccounts = await createPaymentAccounts();
    const draws = await createDraws(admin._id);
    const prizes = await createPrizes(draws);
    const { payments, tokens } = await createPaymentsAndTokens(users, draws, admin._id);
    await createReferrals(users);
    await createPendingPayments(users, draws);
    await assignWinningTokens(draws, tokens, prizes);
    await assignSecretTokens(draws, prizes);

    console.log('\n========================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================\n');

    console.log('📋 SUMMARY:');
    console.log('----------------------------');
    console.log(`👨‍💼 Admin: 1`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏦 Payment Accounts: ${paymentAccounts.length}`);
    console.log(`🎰 Draws: ${draws.length}`);
    console.log(`🏆 Prizes: ${prizes.length}`);
    console.log(`💳 Payments: ${payments.length}`);
    console.log(`🎟️  Tokens: ${tokens.length}`);
    console.log('----------------------------\n');

    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('----------------------------');
    console.log('ADMIN:');
    console.log('  Email: sam@gmail.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('USERS (all have password: user123):');
    console.log('  - ahmed@example.com');
    console.log('  - sara@example.com');
    console.log('  - bilal@example.com');
    console.log('  - fatima@example.com');
    console.log('  - usman@example.com');
    console.log('  - ayesha@example.com');
    console.log('  - hassan@example.com');
    console.log('  - zainab@example.com');
    console.log('  - ali@example.com');
    console.log('  - maryam@example.com');
    console.log('');
    console.log('🏦 PAYMENT ACCOUNTS:');
    console.log('  EasyPaisa (PRIMARY): 03001234567');
    console.log('  EasyPaisa (Backup):  03009876543');
    console.log('  JazzCash (Active):   03111234567');
    console.log('  JazzCash (Inactive): 03119876543');
    console.log('----------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();