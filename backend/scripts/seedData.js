import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Service from '../models/Service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/winqroo';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Service.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create 7 shop owners with shops
    console.log('👤 Creating shop owners and shops...');
    const shopOwners = [];
    const shops = [];
    const allServices = [];

    const shopData = [
      {
        owner: {
          name: 'Rajesh Kumar',
          email: 'rajesh@rajhairsalon.com',
          phone: '+91-836-2345678',
        },
        shop: {
          name: 'Raj Hair Salon',
          description: 'Premium hair salon offering modern haircuts and styling services in Dharwad',
          street: 'Station Road, Near City Bus Stand',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580001',
          coordinates: [75.0078, 15.4589], // Dharwad coordinates [longitude, latitude]
          phone: '+91-836-2345678',
          email: 'info@rajhairsalon.com',
        },
        services: [
          { name: 'Classic Haircut', description: 'Traditional men\'s haircut', duration: 30, price: 150, category: 'Haircut' },
          { name: 'Beard Trim', description: 'Professional beard trimming', duration: 20, price: 80, category: 'Grooming' },
          { name: 'Haircut + Beard', description: 'Complete grooming package', duration: 45, price: 200, category: 'Package' },
          { name: 'Hot Towel Shave', description: 'Traditional hot towel shave', duration: 25, price: 120, category: 'Shave' },
        ],
      },
      {
        owner: {
          name: 'Kumar Reddy',
          email: 'kumar@kumarhairstudio.com',
          phone: '+91-836-2456789',
        },
        shop: {
          name: 'Kumar Hair Studio',
          description: 'Modern salon with trendy cuts and styling in Dharwad',
          street: 'KCD Circle, Near Hubli-Dharwad Road',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580001',
          coordinates: [75.0120, 15.4620],
          phone: '+91-836-2456789',
          email: 'info@kumarhairstudio.com',
        },
        services: [
          { name: 'Fade Cut', description: 'Modern fade haircut', duration: 35, price: 180, category: 'Haircut' },
          { name: 'Hair Styling', description: 'Professional styling', duration: 20, price: 100, category: 'Styling' },
          { name: 'Hair Wash & Cut', description: 'Wash, cut, and style', duration: 45, price: 250, category: 'Package' },
        ],
      },
      {
        owner: {
          name: 'Suresh Naik',
          email: 'suresh@naikbarbershop.com',
          phone: '+91-836-2567890',
        },
        shop: {
          name: 'Naik Barber Shop',
          description: 'Classic barbershop with traditional charm in Dharwad',
          street: 'Gandhi Chowk, Near Old Bus Stand',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580001',
          coordinates: [75.0050, 15.4550],
          phone: '+91-836-2567890',
          email: 'info@naikbarbershop.com',
        },
        services: [
          { name: 'Traditional Cut', description: 'Classic barbershop cut', duration: 30, price: 120, category: 'Haircut' },
          { name: 'Straight Razor Shave', description: 'Traditional straight razor', duration: 30, price: 100, category: 'Shave' },
          { name: 'Mustache Trim', description: 'Precise mustache trimming', duration: 15, price: 60, category: 'Grooming' },
        ],
      },
      {
        owner: {
          name: 'Priya Shetty',
          email: 'priya@premiumcutsdharwad.com',
          phone: '+91-836-2678901',
        },
        shop: {
          name: 'Premium Cuts Dharwad',
          description: 'Luxury grooming experience for the modern gentleman in Dharwad',
          street: 'SDM College Road, Near Saptapur',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580009',
          coordinates: [75.0150, 15.4650],
          phone: '+91-836-2678901',
          email: 'info@premiumcutsdharwad.com',
        },
        services: [
          { name: 'Executive Cut', description: 'Premium haircut for professionals', duration: 40, price: 300, category: 'Haircut' },
          { name: 'Deluxe Grooming', description: 'Full grooming service', duration: 60, price: 450, category: 'Package' },
          { name: 'Beard Styling', description: 'Professional beard styling', duration: 25, price: 150, category: 'Grooming' },
          { name: 'Hair Treatment', description: 'Deep conditioning treatment', duration: 20, price: 200, category: 'Treatment' },
        ],
      },
      {
        owner: {
          name: 'Ramesh Patil',
          email: 'ramesh@quickcutsdharwad.com',
          phone: '+91-836-2789012',
        },
        shop: {
          name: 'Quick Cuts Dharwad',
          description: 'Fast, affordable haircuts for everyone in Dharwad',
          street: 'Karnataka College Road, Near Market',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580001',
          coordinates: [75.0100, 15.4600],
          phone: '+91-836-2789012',
          email: 'info@quickcutsdharwad.com',
        },
        services: [
          { name: 'Quick Cut', description: 'Fast haircut service', duration: 20, price: 100, category: 'Haircut' },
          { name: 'Beard Trim', description: 'Quick beard trim', duration: 15, price: 70, category: 'Grooming' },
          { name: 'Student Discount Cut', description: 'Discounted cut for students', duration: 25, price: 80, category: 'Haircut' },
        ],
      },
      {
        owner: {
          name: 'Lakshmi Desai',
          email: 'lakshmi@urbancutsdharwad.com',
          phone: '+91-836-2890123',
        },
        shop: {
          name: 'Urban Cuts Dharwad',
          description: 'Trendy urban barbershop with modern techniques in Dharwad',
          street: 'Vidyagiri, Near BVB College',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580004',
          coordinates: [75.0080, 15.4630],
          phone: '+91-836-2890123',
          email: 'info@urbancutsdharwad.com',
        },
        services: [
          { name: 'Urban Fade', description: 'Modern urban fade', duration: 40, price: 220, category: 'Haircut' },
          { name: 'Design Cut', description: 'Creative design haircut', duration: 45, price: 250, category: 'Haircut' },
          { name: 'Line Up', description: 'Precise line up service', duration: 20, price: 110, category: 'Grooming' },
          { name: 'Color Touch Up', description: 'Hair color touch up', duration: 30, price: 350, category: 'Styling' },
        ],
      },
      {
        owner: {
          name: 'Ravi Joshi',
          email: 'ravi@gentlemensgroomdharwad.com',
          phone: '+91-836-2901234',
        },
        shop: {
          name: 'Gentleman\'s Groom Dharwad',
          description: 'Premium grooming services for the distinguished gentleman in Dharwad',
          street: 'HDMC Road, Near Court Circle',
          city: 'Dharwad',
          state: 'Karnataka',
          zipCode: '580001',
          coordinates: [75.0090, 15.4590],
          phone: '+91-836-2901234',
          email: 'info@gentlemensgroomdharwad.com',
        },
        services: [
          { name: 'Signature Cut', description: 'Our signature haircut', duration: 45, price: 350, category: 'Haircut' },
          { name: 'Royal Shave', description: 'Premium hot towel shave', duration: 35, price: 180, category: 'Shave' },
          { name: 'Complete Grooming', description: 'Full service grooming', duration: 75, price: 500, category: 'Package' },
          { name: 'Beard Sculpting', description: 'Professional beard sculpting', duration: 30, price: 200, category: 'Grooming' },
          { name: 'Hair & Scalp Treatment', description: 'Luxury hair treatment', duration: 25, price: 250, category: 'Treatment' },
        ],
      },
    ];

    // Create shop owners and shops
    for (let i = 0; i < shopData.length; i++) {
      const data = shopData[i];
      const password = await bcrypt.hash('password123', 10);
      
      // Create shop owner
      const owner = await User.create({
        name: data.owner.name,
        email: data.owner.email,
        password: password,
        role: 'shop_owner',
        phone: data.owner.phone,
      });
      shopOwners.push(owner);
      console.log(`✅ Shop owner ${i + 1}/7 created: ${owner.email}`);

      // Create shop
      const shop = await Shop.create({
        owner: owner._id,
        name: data.shop.name,
        description: data.shop.description,
        address: {
          street: data.shop.street,
          city: data.shop.city,
          state: data.shop.state,
          zipCode: data.shop.zipCode,
          country: 'India',
        },
        location: {
          type: 'Point',
          coordinates: data.shop.coordinates,
        },
        phone: data.shop.phone,
        email: data.shop.email,
        openingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '19:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false },
        },
        isActive: true,
        rating: {
          average: 4.0 + Math.random() * 1.0, // Random rating between 4.0 and 5.0
          count: Math.floor(Math.random() * 50) + 10, // Random count between 10 and 60
        },
      });
      shops.push(shop);
      console.log(`✅ Shop ${i + 1}/7 created: ${shop.name}`);

      // Create services for this shop
      const shopServices = await Service.insertMany(
        data.services.map(service => ({
          shop: shop._id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          isActive: true,
          category: service.category,
        }))
      );
      allServices.push(...shopServices);
      console.log(`✅ ${shopServices.length} services created for ${shop.name}`);
    }

    // Create demo customers
    console.log('\n👥 Creating customers...');
    const customer1Password = await bcrypt.hash('password123', 10);
    const customer1 = await User.create({
      name: 'Arjun Sharma',
      email: 'arjun@example.com',
      password: customer1Password,
      role: 'customer',
      phone: '+91-9876543210',
    });

    const customer2Password = await bcrypt.hash('password123', 10);
    const customer2 = await User.create({
      name: 'Priyanka Patel',
      email: 'priyanka@example.com',
      password: customer2Password,
      role: 'customer',
      phone: '+91-9876543211',
    });
    console.log(`✅ Customers created: ${customer1.email}, ${customer2.email}`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Shop Owners (all passwords: password123):');
    shopOwners.forEach((owner, index) => {
      console.log(`  ${index + 1}. ${owner.name} - ${owner.email}`);
    });
    console.log('\nCustomers:');
    console.log(`  Email: ${customer1.email} / Password: password123`);
    console.log(`  Email: ${customer2.email} / Password: password123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`  - ${shopOwners.length} shop owners created`);
    console.log(`  - ${shops.length} shops created`);
    console.log(`  - ${allServices.length} services created`);
    console.log(`  - ${2} customers created`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
