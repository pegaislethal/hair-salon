import dns from 'node:dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Service from '../src/models/Service';

dotenv.config();

const servers = process.env.MONGODB_DNS_SERVERS
  ? process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
if (servers.length) {
  dns.setServers(servers);
}

interface ServiceSeedItem {
  name: string;
  category: string;
  description: string;
  price: number;
  priceType?: 'fixed' | 'range' | 'starting';
  maxPrice?: number;
  priceUnit?: string;
  categoryDescription?: string;
  includedItems?: string[];
  duration?: number;
  matchNames?: string[]; // for matching and updating existing legacy service records
}

const menuData: ServiceSeedItem[] = [
  // A. Hair Services - Gents
  {
    name: 'Fade & Skin Fade Haircut',
    category: 'Hair Services - Gents',
    description: 'Fade and skin fade haircut',
    price: 500,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Fade Haircut', 'Fade & Skin Fade Haircut'],
  },
  {
    name: 'Kids Haircut (Gents)',
    category: 'Hair Services - Gents',
    description: 'Under 10 Years',
    price: 450,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Kids Haircut'],
  },
  {
    name: 'Senior Haircut',
    category: 'Hair Services - Gents',
    description: '60+ Years',
    price: 450,
    priceType: 'fixed',
    duration: 35,
    matchNames: ['Senior Haircut'],
  },
  {
    name: 'Classic Haircut',
    category: 'Hair Services - Gents',
    description: 'Long/Medium Length',
    price: 600,
    priceType: 'fixed',
    duration: 40,
    matchNames: ['Classic Haircut'],
  },
  {
    name: 'Modern Haircut',
    category: 'Hair Services - Gents',
    description: 'Long/Medium Length',
    price: 700,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Modern Haircut', "Men's Haircut", 'Haircut (Men)'],
  },

  // A. Hair Services - Ladies
  {
    name: 'Ladies Haircut',
    category: 'Hair Services - Ladies',
    description: 'Ladies haircut',
    price: 800,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Haircut', 'Haircut (Women)', 'Ladies Haircut'],
  },
  {
    name: 'Hair Trimming / Split Ends',
    category: 'Hair Services - Ladies',
    description: 'Hair trimming and split ends',
    price: 500,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Hair Trimming / Split Ends'],
  },
  {
    name: 'Kids Haircut (Ladies)',
    category: 'Hair Services - Ladies',
    description: 'Under 10 Years',
    price: 500,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Kids Haircut (Ladies)'],
  },

  // B. Beard Services
  {
    name: 'Beard Trim',
    category: 'Beard Services',
    description: 'Neat trimming and grooming for your beard.',
    price: 200,
    priceType: 'fixed',
    duration: 20,
    matchNames: ['Beard Trim', 'Beard Trimming'],
  },
  {
    name: 'Beard Line-Up',
    category: 'Beard Services',
    description: 'Crisp cheek and neck line-up definition.',
    price: 150,
    priceType: 'fixed',
    duration: 15,
    matchNames: ['Beard Line-Up'],
  },
  {
    name: 'Beard Shape-Up with Steam',
    category: 'Beard Services',
    description: 'Beard shaping treatment accompanied with warm facial steam.',
    price: 300,
    priceType: 'fixed',
    duration: 25,
    matchNames: ['Beard Shape-Up with Steam'],
  },
  {
    name: 'Beard Hot Towel Shave',
    category: 'Beard Services',
    description: 'Traditional hot towel shave for ultimate comfort and closeness.',
    price: 350,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Beard Hot Towel Shave'],
  },

  // C. Add-On Services
  {
    name: 'Hair Design',
    category: 'Add-On Services',
    description: 'Custom artistic razor and clipper line designs.',
    price: 50,
    priceType: 'starting',
    duration: 15,
    matchNames: ['Hair Design'],
  },
  {
    name: 'Eyebrow Shape-Up',
    category: 'Add-On Services',
    description: 'Eyebrow shaping',
    price: 50,
    priceType: 'fixed',
    duration: 10,
    matchNames: ['Eyebrow Shape-Up'],
  },
  {
    name: 'Hair Styling (Without Wash)',
    category: 'Add-On Services',
    description: 'Styling without hair wash',
    price: 150,
    priceType: 'fixed',
    duration: 20,
    matchNames: ['Hair Styling (Without Wash)'],
  },
  {
    name: 'Hair Styling (With Wash)',
    category: 'Add-On Services',
    description: 'Styling with hair wash',
    price: 250,
    priceType: 'fixed',
    duration: 35,
    matchNames: ['Hair Styling (With Wash)', 'Hair Styling', 'Hair Wash'],
  },
  {
    name: 'Braids',
    category: 'Add-On Services',
    description: 'Price per braid',
    price: 200,
    priceType: 'fixed',
    priceUnit: 'per braid',
    duration: 30,
    matchNames: ['Braids'],
  },
  {
    name: 'Hair Perm (Men)',
    category: 'Add-On Services',
    description: 'Price range',
    price: 3000,
    priceType: 'range',
    maxPrice: 4000,
    duration: 90,
    matchNames: ['Hair Perm', 'Hair Perm (Men)'],
  },
  {
    name: "Men's Root Touch-Up",
    category: 'Add-On Services',
    description: 'Price range',
    price: 1000,
    priceType: 'range',
    maxPrice: 1200,
    duration: 45,
    matchNames: ["Men's Root Touch-Up"],
  },

  // D. Hair Spa
  {
    name: 'Hair Spa - Ladies',
    category: 'Hair Spa',
    description: 'According to length and thickness',
    price: 1500,
    priceType: 'starting',
    duration: 75,
    matchNames: ['Hair Spa - Ladies', 'Hair Spa'],
  },
  {
    name: 'Hair Spa - Gents',
    category: 'Hair Spa',
    description: 'According to length and thickness',
    price: 800,
    priceType: 'starting',
    duration: 45,
    matchNames: ['Hair Spa - Gents'],
  },

  // E. Oil Massage
  {
    name: 'Oil Massage - Ladies',
    category: 'Oil Massage',
    categoryDescription: 'Head & Shoulder',
    description: 'According to length and thickness',
    price: 1200,
    priceType: 'starting',
    duration: 45,
    matchNames: ['Oil Massage - Ladies'],
  },
  {
    name: 'Oil Massage - Gents',
    category: 'Oil Massage',
    categoryDescription: 'Head & Shoulder',
    description: 'According to length and thickness',
    price: 800,
    priceType: 'starting',
    duration: 35,
    matchNames: ['Oil Massage - Gents'],
  },
  {
    name: 'Dry Massage',
    category: 'Oil Massage',
    categoryDescription: 'Head & Shoulder',
    description: 'Dry massage',
    price: 800,
    priceType: 'starting',
    duration: 30,
    matchNames: ['Dry Massage'],
  },

  // F. Hair Setting
  {
    name: 'Blow Dry Setting (Without Wash)',
    category: 'Hair Setting',
    description: 'Without Wash',
    price: 650,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Blow Dry Setting (Without Wash)'],
  },
  {
    name: 'Blow Dry Setting (With Wash)',
    category: 'Hair Setting',
    description: 'With Wash',
    price: 800,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Blow Dry Setting (With Wash)'],
  },
  {
    name: 'Party Roller',
    category: 'Hair Setting',
    description: 'Starting from',
    price: 1000,
    priceType: 'starting',
    duration: 45,
    matchNames: ['Party Roller'],
  },
  {
    name: 'Temporary Hair Straight - Ladies',
    category: 'Hair Setting',
    description: 'Starting from',
    price: 1000,
    priceType: 'starting',
    duration: 45,
    matchNames: ['Temporary Hair Straight - Ladies'],
  },
  {
    name: 'Temporary Hair Straight - Gents',
    category: 'Hair Setting',
    description: 'Starting from',
    price: 800,
    priceType: 'starting',
    duration: 30,
    matchNames: ['Temporary Hair Straight - Gents'],
  },
  {
    name: 'Juro',
    category: 'Hair Setting',
    description: 'According to types of Juro',
    price: 1800,
    priceType: 'range',
    maxPrice: 2500,
    duration: 60,
    matchNames: ['Juro'],
  },

  // G. Hair Straightening
  {
    name: 'Hair Straightening - Gents',
    category: 'Hair Straightening',
    categoryDescription: 'According to length and thickness of hair',
    description: 'Professional smoothing and permanent straightening for gents.',
    price: 3500,
    priceType: 'starting',
    duration: 120,
    matchNames: ['Hair Straightening - Gents'],
  },
  {
    name: 'Hair Straightening - Ladies',
    category: 'Hair Straightening',
    categoryDescription: 'According to length and thickness of hair',
    description: 'Silky smooth straightening treatment tailored for ladies hair length.',
    price: 5000,
    priceType: 'starting',
    duration: 180,
    matchNames: ['Hair Straightening - Ladies', 'Hair Straightening'],
  },

  // H. Hair Perming
  {
    name: 'Hair Perming',
    category: 'Hair Perming',
    categoryDescription: 'According to length and thickness of hair',
    description: 'Long-lasting curls, waves, and volume treatment.',
    price: 7000,
    priceType: 'starting',
    duration: 180,
    matchNames: ['Hair Perming'],
  },

  // I. Waxing
  {
    name: 'Armpit Waxing',
    category: 'Waxing',
    description: 'Under arms',
    price: 300,
    priceType: 'fixed',
    duration: 15,
    matchNames: ['Armpit', 'Armpit Waxing'],
  },
  {
    name: 'Full Hands Waxing',
    category: 'Waxing',
    description: 'Full hands waxing',
    price: 1000,
    priceType: 'fixed',
    duration: 30,
    matchNames: ['Full Hands', 'Full Hands Waxing'],
  },
  {
    name: 'Half Hands Waxing',
    category: 'Waxing',
    description: 'Half hands waxing',
    price: 550,
    priceType: 'fixed',
    duration: 20,
    matchNames: ['Half Hands', 'Half Hands Waxing'],
  },
  {
    name: 'Full Legs Waxing',
    category: 'Waxing',
    description: 'Full legs waxing',
    price: 1500,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Full Legs', 'Full Legs Waxing'],
  },
  {
    name: 'Half Legs Waxing',
    category: 'Waxing',
    description: 'Half legs waxing',
    price: 800,
    priceType: 'fixed',
    duration: 25,
    matchNames: ['Half Legs', 'Half Legs Waxing'],
  },
  {
    name: 'Full Body Waxing',
    category: 'Waxing',
    description: 'Full body waxing',
    price: 4000,
    priceType: 'fixed',
    duration: 90,
    matchNames: ['Full Body', 'Full Body Waxing'],
  },

  // J. Ladies Coloring
  {
    name: 'Black Color (Ladies)',
    category: 'Ladies Coloring',
    description: 'According to length and thickness of hair',
    price: 2500,
    priceType: 'starting',
    duration: 90,
    matchNames: ['Black Color', 'Black Color (Ladies)'],
  },
  {
    name: 'High Lighting Color (Ladies)',
    category: 'Ladies Coloring',
    description: 'According to length and thickness of hair',
    price: 3500,
    priceType: 'starting',
    duration: 150,
    matchNames: ['High Lighting Color (Ladies)', 'Highlights'],
  },
  {
    name: 'Global Color (Ladies)',
    category: 'Ladies Coloring',
    description: 'According to length and thickness of hair',
    price: 5000,
    priceType: 'starting',
    duration: 120,
    matchNames: ['Global Color (Ladies)', 'Global Color', 'Hair Color', 'Hair Coloring'],
  },
  {
    name: 'Root Touch (Ladies)',
    category: 'Ladies Coloring',
    description: 'Root touch-up',
    price: 2000,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Root Touch', 'Root Touch (Ladies)'],
  },
  {
    name: 'Air Touch',
    category: 'Ladies Coloring',
    description: 'Include Base',
    price: 10000,
    priceType: 'starting',
    duration: 240,
    matchNames: ['Air Touch'],
  },
  {
    name: 'Balayage',
    category: 'Ladies Coloring',
    description: 'Include Base',
    price: 10000,
    priceType: 'starting',
    duration: 240,
    matchNames: ['Balayage'],
  },
  {
    name: 'Ombre',
    category: 'Ladies Coloring',
    description: 'Include Base',
    price: 10000,
    priceType: 'starting',
    duration: 240,
    matchNames: ['Ombre'],
  },

  // K. VIP Service Men
  {
    name: 'VIP Haircut + Beards + Cleansing',
    category: 'VIP Service Men',
    categoryDescription: 'With Beard',
    description: 'Haircut + Beards + Cleansing',
    price: 1000,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Haircut + Beards + Cleansing', 'Haircut + Beard Combo', 'VIP Haircut + Beards + Cleansing'],
  },
  {
    name: 'VIP Haircut + Beards + Cleansing + Face Mask',
    category: 'VIP Service Men',
    categoryDescription: 'With Beard',
    description: 'Haircut + Beards + Cleansing + Face Mask',
    price: 1500,
    priceType: 'fixed',
    duration: 75,
    matchNames: ['Haircut + Beards + Cleansing + Face Mask', 'VIP Haircut + Beards + Cleansing + Face Mask'],
  },
  {
    name: 'VIP Haircut + Cleansing',
    category: 'VIP Service Men',
    categoryDescription: 'Without Beard',
    description: 'Haircut + Cleansing',
    price: 800,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Haircut + Cleansing', 'VIP Haircut + Cleansing'],
  },
  {
    name: 'VIP Haircut + Cleansing + Face Mask',
    category: 'VIP Service Men',
    categoryDescription: 'Without Beard',
    description: 'Haircut + Cleansing + Face Mask',
    price: 1300,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Haircut + Cleansing + Face Mask', 'VIP Haircut + Cleansing + Face Mask'],
  },

  // L. Threading
  {
    name: 'Eye Brows Threading',
    category: 'Threading',
    description: 'Precise shape and cleanup of eyebrows via fine cotton threading.',
    price: 100,
    priceType: 'fixed',
    duration: 15,
    matchNames: ['Eye Brows', 'Threading (Eyebrow)', 'Eye Brows Threading'],
  },
  {
    name: 'Upper Lips Threading',
    category: 'Threading',
    description: 'Gentle hair removal for the upper lip area.',
    price: 50,
    priceType: 'fixed',
    duration: 10,
    matchNames: ['Upper Lips', 'Upper Lips Threading'],
  },
  {
    name: 'Lower Lips Threading',
    category: 'Threading',
    description: 'Precise threading for lower lip perimeter.',
    price: 50,
    priceType: 'fixed',
    duration: 10,
    matchNames: ['Lower Lips', 'Lower Lips Threading'],
  },
  {
    name: 'Fore Head Threading',
    category: 'Threading',
    description: 'Smooth hairline and forehead threading.',
    price: 50,
    priceType: 'fixed',
    duration: 10,
    matchNames: ['Fore Head', 'Fore Head Threading'],
  },
  {
    name: 'Full Face Threading',
    category: 'Threading',
    description: 'Complete face threading for a silky, radiant finish.',
    price: 350,
    priceType: 'fixed',
    duration: 35,
    matchNames: ['Full Face', 'Full Face Threading'],
  },

  // M. Hair Treatment
  {
    name: 'Hair Treatment - Ladies',
    category: 'Hair Treatment',
    description: 'According to length and thickness',
    price: 1000,
    priceType: 'starting',
    duration: 60,
    matchNames: ['Hair Treatment - Ladies'],
  },
  {
    name: 'Hair Treatment - Gents',
    category: 'Hair Treatment',
    description: 'According to length and thickness',
    price: 800,
    priceType: 'starting',
    duration: 45,
    matchNames: ['Hair Treatment - Gents'],
  },
  {
    name: 'Plex Treatment',
    category: 'Hair Treatment',
    description: 'Bond-rebuilding restorative treatment for stressed or bleached hair.',
    price: 3000,
    priceType: 'starting',
    duration: 75,
    matchNames: ['Plex Treatment'],
  },
  {
    name: 'Botox Hair Treatment',
    category: 'Hair Treatment',
    description: 'Deep hydrating filler therapy that restores fiber and luster.',
    price: 7000,
    priceType: 'starting',
    duration: 120,
    matchNames: ['Botox', 'Botox Hair Treatment'],
  },
  {
    name: 'Nanoplastia',
    category: 'Hair Treatment',
    description: 'Advanced organic nano-straightening and gloss treatment.',
    price: 7000,
    priceType: 'starting',
    duration: 180,
    matchNames: ['Nanoplastia'],
  },
  {
    name: 'Keratin Treatment',
    category: 'Hair Treatment',
    description: 'Intense anti-frizz smoothing and straightening therapy.',
    price: 4500,
    priceType: 'starting',
    duration: 150,
    matchNames: ['Keratin', 'Keratin Treatment'],
  },
  {
    name: 'Keratin (Brazilian)',
    category: 'Hair Treatment',
    description: 'Brazilian blowout keratin treatment for maximum smoothness and shine.',
    price: 7000,
    priceType: 'starting',
    duration: 180,
    matchNames: ['Keratin (Brazilian)'],
  },

  // N. Gents Coloring
  {
    name: 'High Lighting Color (Gents)',
    category: 'Gents Coloring',
    description: 'Starting from',
    price: 2000,
    priceType: 'starting',
    duration: 75,
    matchNames: ['High Lighting Color (Gents)'],
  },
  {
    name: 'Global Color (Gents)',
    category: 'Gents Coloring',
    description: 'According to length and thickness of hair',
    price: 2500,
    priceType: 'starting',
    duration: 75,
    matchNames: ['Global Color (Gents)'],
  },

  // O. Facial (Normal)
  {
    name: 'Cleansing (Normal Facial)',
    category: 'Facial (Normal)',
    description: 'Cleansing, Scrub, Toning, Face Pack',
    price: 800,
    priceType: 'fixed',
    duration: 35,
    matchNames: ['Cleansing (Normal Facial)'],
  },
  {
    name: 'Normal Facial',
    category: 'Facial (Normal)',
    description: 'Normal facial',
    price: 1800,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Normal Facial', 'Facial'],
  },

  // P. Facial (Specialty)
  {
    name: 'Cleansing (Specialty Facial)',
    category: 'Facial',
    description: 'Cleansing, Scrub, Toning, Face Pack',
    price: 1200,
    priceType: 'fixed',
    duration: 40,
    matchNames: ['Cleansing (Specialty Facial)', 'Cleansing'],
  },
  {
    name: 'Lotus Facial',
    category: 'Facial',
    description: 'Price range',
    price: 2500,
    priceType: 'range',
    maxPrice: 5500,
    duration: 60,
    matchNames: ['Lotus Facial'],
  },
  {
    name: 'Casmara Facial',
    category: 'Facial',
    description: 'Price range',
    price: 3500,
    priceType: 'range',
    maxPrice: 6000,
    duration: 75,
    matchNames: ['Casmara Facial'],
  },
  {
    name: 'Kanpeki Facial',
    category: 'Facial',
    description: 'Price range',
    price: 2500,
    priceType: 'range',
    maxPrice: 4500,
    duration: 60,
    matchNames: ['Kanpeki', 'Kanpeki Facial'],
  },
  {
    name: 'Brillare Facial',
    category: 'Facial',
    description: 'Price range',
    price: 2000,
    priceType: 'range',
    maxPrice: 4000,
    duration: 60,
    matchNames: ['Brillare', 'Brillare Facial'],
  },
  {
    name: 'O3+ Facial',
    category: 'Facial',
    description: 'Price range',
    price: 2500,
    priceType: 'range',
    maxPrice: 4500,
    duration: 60,
    matchNames: ['O3+', 'O3+ Facial'],
  },

  // Q. Manicure & Pedicure - Normal
  {
    name: 'Normal Manicure',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Normal',
    description: 'Essential nail shaping, cuticle conditioning, and hand massage.',
    price: 1500,
    priceType: 'fixed',
    duration: 45,
    matchNames: ['Normal Manicure', 'Manicure'],
  },
  {
    name: 'Normal Pedicure',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Normal',
    description: 'Foot soak, exfoliating scrub, cuticle care, and nail polish.',
    price: 2000,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Normal Pedicure', 'Pedicure'],
  },
  {
    name: 'Normal Combo (Mani + Pedi)',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Normal',
    description: 'Complete hands and feet revitalizing combo package.',
    price: 3000,
    priceType: 'fixed',
    duration: 90,
    matchNames: ['Normal Combo (Mani + Pedi)'],
  },

  // Q. Manicure & Pedicure - Luxury
  {
    name: 'Luxury Manicure',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Luxury',
    description: 'Deluxe hand treatment with exfoliating mask, warm towel, and deep massage.',
    price: 2000,
    priceType: 'fixed',
    duration: 60,
    matchNames: ['Luxury Manicure'],
  },
  {
    name: 'Luxury Pedicure',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Luxury',
    description: 'Spa foot soak, organic scrub, callous removal, paraffin/pack, and massage.',
    price: 2500,
    priceType: 'fixed',
    duration: 75,
    matchNames: ['Luxury Pedicure'],
  },
  {
    name: 'Luxury Combo (Mani + Pedi)',
    category: 'Manicure & Pedicure',
    categoryDescription: 'Luxury',
    description: 'Ultimate head-to-toe pampering with luxury hand and foot ritual.',
    price: 4000,
    priceType: 'fixed',
    duration: 120,
    matchNames: ['Luxury Combo (Mani + Pedi)'],
  },

  // R. Makeup
  {
    name: 'Party Makeup',
    category: 'Makeup',
    description: 'Include Hair and Dress Up',
    price: 4500,
    priceType: 'fixed',
    duration: 90,
    matchNames: ['Party Makeup'],
  },
  {
    name: 'Engagement Makeup',
    category: 'Makeup',
    description: 'Engagement makeup',
    price: 15000,
    priceType: 'fixed',
    duration: 150,
    matchNames: ['Engagement Makeup'],
  },
  {
    name: 'Bridal Makeup',
    category: 'Makeup',
    description: 'Bridal makeup',
    price: 18000,
    priceType: 'fixed',
    duration: 180,
    matchNames: ['Bridal Makeup'],
  },

  // S. Bridal Package
  {
    name: 'Bridal Package',
    category: 'Bridal Package',
    description: 'Complete bridal luxury package with all essential treatments included.',
    price: 40000,
    priceType: 'fixed',
    duration: 360,
    includedItems: [
      'Facial',
      'Waxing',
      'Manicure',
      'Pedicure',
      'Threading',
      'Hand Mehendi',
      'Leg Mehendi',
    ],
    matchNames: ['Bridal Package'],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB.');

  const existingServices = await Service.find();
  console.log(`Found ${existingServices.length} existing service records.`);

  const matchedExistingIds = new Set<string>();
  let updatedCount = 0;
  let createdCount = 0;

  for (const item of menuData) {
    // Attempt to match an existing service by name or matchNames
    let matchedDoc = existingServices.find((s) => {
      if (matchedExistingIds.has(s._id.toString())) return false;
      const sName = s.name.trim().toLowerCase();
      if (sName === item.name.toLowerCase()) return true;
      if (item.matchNames) {
        return item.matchNames.some((m) => m.toLowerCase() === sName);
      }
      return false;
    });

    const updatePayload = {
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      priceType: item.priceType || 'fixed',
      maxPrice: item.maxPrice || undefined,
      priceUnit: item.priceUnit || undefined,
      categoryDescription: item.categoryDescription || undefined,
      includedItems: item.includedItems || [],
      duration: item.duration || 45,
      bufferDuration: 15,
      isActive: true,
    };

    if (matchedDoc) {
      matchedExistingIds.add(matchedDoc._id.toString());
      await Service.findByIdAndUpdate(matchedDoc._id, updatePayload, { runValidators: true });
      updatedCount++;
      console.log(`[UPDATED] "${matchedDoc.name}" -> "${item.name}" (ID: ${matchedDoc._id})`);
    } else {
      const created = await Service.create(updatePayload);
      matchedExistingIds.add(created._id.toString());
      createdCount++;
      console.log(`[CREATED] "${item.name}" (ID: ${created._id})`);
    }
  }

  console.log('--------------------------------------------------');
  console.log(`Menu Migration Complete:`);
  console.log(`Total Menu Items Processed: ${menuData.length}`);
  console.log(`Updated Existing Services: ${updatedCount}`);
  console.log(`Newly Created Services: ${createdCount}`);
  console.log('--------------------------------------------------');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
