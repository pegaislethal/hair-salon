import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from '../src/models/User';
import SalonSettings from '../src/models/SalonSettings';
import Service from '../src/models/Service';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Super Admin
    const existing = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!existing) {
      await User.create({
        fullName: process.env.SUPER_ADMIN_NAME || 'Iris Admin',
        email: process.env.SUPER_ADMIN_EMAIL,
        phone: '+977-9800000000',
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: 'super_admin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('✅ Super admin created:', process.env.SUPER_ADMIN_EMAIL);
    } else {
      console.log('ℹ️  Super admin already exists');
    }

    // Salon Settings
    const settingsExist = await SalonSettings.findOne();
    if (!settingsExist) {
      await SalonSettings.create({
        businessName: 'Iris Hair Cut and Salon',
        address: 'Kathmandu, Nepal',
        city: 'Kathmandu',
        country: 'Nepal',
        contactPhone: '+977-9800000000',
        contactEmail: process.env.SUPER_ADMIN_EMAIL,
        notificationEmail: process.env.SALON_NOTIFICATION_EMAIL || process.env.SUPER_ADMIN_EMAIL,
      });
      console.log('✅ Salon settings initialized');
    }

    // Sample Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany([
        { name: 'Haircut (Women)', description: 'Professional haircut with wash and blow dry.', price: 800, duration: 60, category: 'Hair' },
        { name: 'Haircut (Men)', description: 'Classic men\'s haircut with styling.', price: 400, duration: 30, category: 'Hair' },
        { name: 'Hair Color', description: 'Full head color treatment with professional products.', price: 2500, duration: 120, category: 'Hair Color' },
        { name: 'Highlights', description: 'Partial or full highlights for a beautiful look.', price: 3000, duration: 150, category: 'Hair Color' },
        { name: 'Hair Spa', description: 'Deep conditioning and scalp treatment.', price: 1500, duration: 90, category: 'Hair Treatment' },
        { name: 'Facial', description: 'Relaxing facial treatment with cleansing and moisturizing.', price: 1200, duration: 60, category: 'Skin Care' },
        { name: 'Threading (Eyebrow)', description: 'Precise eyebrow shaping via threading.', price: 150, duration: 15, category: 'Beauty' },
        { name: 'Manicure', description: 'Complete nail care and polish for hands.', price: 600, duration: 45, category: 'Nails' },
        { name: 'Pedicure', description: 'Complete nail care and polish for feet.', price: 700, duration: 60, category: 'Nails' },
        { name: 'Bridal Package', description: 'Complete bridal makeup, hair styling, and beauty package.', price: 15000, duration: 300, category: 'Bridal' },
      ]);
      console.log('✅ Sample services seeded');
    }

    console.log('\n🌸 Seed completed successfully!');
    console.log(`   Admin email: ${process.env.SUPER_ADMIN_EMAIL}`);
    console.log(`   Admin password: ${process.env.SUPER_ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
