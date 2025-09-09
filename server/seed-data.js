const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const Staff = require('./models/Staff');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sample services data
const services = [
  {
    name: 'Haircut',
    description: 'Professional haircut and styling',
    duration: 45,
    price: 45,
    category: 'Hair',
    isActive: true
  },
  {
    name: 'Hair Coloring',
    description: 'Full color treatment with premium products',
    duration: 120,
    price: 120,
    category: 'Hair',
    isActive: true
  },
  {
    name: 'Braids',
    description: 'Various braiding styles',
    duration: 150,
    price: 100,
    category: 'Hair',
    isActive: true
  },
  {
    name: 'Hair Treatment',
    description: 'Deep conditioning and repair treatment',
    duration: 60,
    price: 60,
    category: 'Treatment',
    isActive: true
  },
  {
    name: 'Styling',
    description: 'Hair styling for special occasions',
    duration: 30,
    price: 35,
    category: 'Hair',
    isActive: true
  }
];

// Sample staff data
const staffMembers = [
  {
    name: 'Sarah Johnson',
    title: 'Senior Stylist',
    email: 'sarah@hairstudio.com',
    phone: '555-123-4567',
    bio: 'Over 10 years of experience specializing in color and cuts',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    specialties: ['Color', 'Cuts', 'Styling'],
    workingHours: {
      monday: { start: '09:00', end: '17:00', isWorking: true },
      tuesday: { start: '09:00', end: '17:00', isWorking: true },
      wednesday: { start: '09:00', end: '17:00', isWorking: true },
      thursday: { start: '09:00', end: '17:00', isWorking: true },
      friday: { start: '09:00', end: '17:00', isWorking: true },
      saturday: { start: '10:00', end: '16:00', isWorking: true },
      sunday: { start: '', end: '', isWorking: false }
    },
    isActive: true
  },
  {
    name: 'Maria Rodriguez',
    title: 'Hair Specialist',
    email: 'maria@hairstudio.com',
    phone: '555-987-6543',
    bio: 'Specializes in braids and textured hair',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    specialties: ['Braids', 'Natural Hair', 'Treatments'],
    workingHours: {
      monday: { start: '10:00', end: '18:00', isWorking: true },
      tuesday: { start: '10:00', end: '18:00', isWorking: true },
      wednesday: { start: '10:00', end: '18:00', isWorking: true },
      thursday: { start: '10:00', end: '18:00', isWorking: true },
      friday: { start: '10:00', end: '18:00', isWorking: true },
      saturday: { start: '10:00', end: '16:00', isWorking: true },
      sunday: { start: '', end: '', isWorking: false }
    },
    isActive: true
  },
  {
    name: 'Ashley Chen',
    title: 'Color Expert',
    email: 'ashley@hairstudio.com',
    phone: '555-456-7890',
    bio: 'Specializes in creative color and balayage',
    photo: 'https://randomuser.me/api/portraits/women/79.jpg',
    specialties: ['Color', 'Balayage', 'Highlights'],
    workingHours: {
      monday: { start: '', end: '', isWorking: false },
      tuesday: { start: '09:00', end: '17:00', isWorking: true },
      wednesday: { start: '09:00', end: '17:00', isWorking: true },
      thursday: { start: '09:00', end: '17:00', isWorking: true },
      friday: { start: '09:00', end: '17:00', isWorking: true },
      saturday: { start: '10:00', end: '16:00', isWorking: true },
      sunday: { start: '', end: '', isWorking: false }
    },
    isActive: true
  }
];

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Service.deleteMany({});
    await Staff.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Insert services
    const createdServices = await Service.insertMany(services);
    console.log(`${createdServices.length} services added`);
    
    // Map service IDs to staff members
    const haircut = createdServices.find(s => s.name === 'Haircut');
    const coloring = createdServices.find(s => s.name === 'Hair Coloring');
    const braids = createdServices.find(s => s.name === 'Braids');
    const treatment = createdServices.find(s => s.name === 'Hair Treatment');
    const styling = createdServices.find(s => s.name === 'Styling');
    
    // Assign services to staff members
    staffMembers[0].services = [haircut._id, coloring._id, styling._id, treatment._id]; // Sarah
    staffMembers[1].services = [haircut._id, braids._id, treatment._id]; // Maria
    staffMembers[2].services = [coloring._id, styling._id]; // Ashley
    
    // Insert staff
    const createdStaff = await Staff.insertMany(staffMembers);
    console.log(`${createdStaff.length} staff members added`);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
