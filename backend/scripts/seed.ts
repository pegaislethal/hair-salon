import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from '../src/models/User';
import SalonSettings from '../src/models/SalonSettings';
import Service from '../src/models/Service';
import HiringSettings from '../src/models/HiringSettings';

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

    // Keep the original sample catalog on an empty database.
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

    const barberServices = [
      { name: "Men's Haircut", description: 'A tailored haircut finished with professional styling.', price: 500, duration: 35, category: 'Hair' },
      { name: 'Fade Haircut', description: 'A precise fade blended to your preferred length and shape.', price: 600, duration: 45, category: 'Hair' },
      { name: 'Kids Haircut', description: 'A comfortable, age-appropriate haircut for children.', price: 350, duration: 30, category: 'Hair' },
      { name: 'Hair Styling', description: 'Professional styling for a polished everyday or special-occasion look.', price: 700, duration: 45, category: 'Hair' },
      { name: 'Hair Wash', description: 'A refreshing shampoo and conditioning service.', price: 300, duration: 20, category: 'Hair Treatment' },
      { name: 'Hair Spa', description: 'Deep conditioning and a relaxing scalp treatment.', price: 1500, duration: 60, category: 'Hair Treatment' },
      { name: 'Hair Coloring', description: 'Professional hair color service tailored to your desired look.', price: 2500, duration: 120, category: 'Hair Color' },
      { name: 'Hair Straightening', description: 'A smoothing and straightening treatment for sleek, manageable hair.', price: 5000, duration: 180, category: 'Hair Treatment' },
      { name: 'Beard Trimming', description: 'A precise beard trim and shape-up.', price: 300, duration: 20, category: 'Grooming' },
      { name: 'Haircut + Beard Combo', description: 'A haircut and beard trim finished as one complete grooming service.', price: 700, duration: 50, category: 'Grooming' },
    ];
    for (const service of barberServices) {
      const existingService = await Service.findOne({ name: new RegExp(`^${service.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (!existingService) await Service.create(service);
    }
    console.log('✅ Barber and salon services added without duplicates');

    await HiringSettings.updateOne({}, { $setOnInsert: { isHiring: false } }, { upsert: true });

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
