const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const Service = require('./models/Service');
const Staff = require('./models/Staff');
const Booking = require('./models/Booking');
const Feedback = require('./models/Feedback');
const LoyaltyProgram = require('./models/LoyaltyProgram');
const CustomerLoyalty = require('./models/CustomerLoyalty');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding mock data'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random time slot
const generateTimeSlot = () => {
  const hours = Math.floor(Math.random() * (19 - 9) + 9); // 9 AM to 7 PM
  const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Generate booking status with weighted distribution
const generateBookingStatus = () => {
  const rand = Math.random();
  if (rand < 0.1) return 'pending';
  if (rand < 0.3) return 'confirmed';
  if (rand < 0.8) return 'completed';
  return 'cancelled';
};

// Seed the database with mock data
const seedMockData = async () => {
  try {
    // Fetch existing services and staff
    const services = await Service.find();
    const staffMembers = await Staff.find();
    
    if (services.length === 0 || staffMembers.length === 0) {
      console.error('No services or staff found. Please run seed-data.js first.');
      process.exit(1);
    }
    
    console.log(`Found ${services.length} services and ${staffMembers.length} staff members`);
    
    // Clear existing mock data
    await Booking.deleteMany({});
    await Feedback.deleteMany({});
    await LoyaltyProgram.deleteMany({});
    await CustomerLoyalty.deleteMany({});
    
    console.log('Previous mock data cleared');
    
    // Create loyalty program
    const loyaltyProgram = await LoyaltyProgram.create({
      name: 'Hair Studio Rewards',
      description: 'Earn points with every booking and redeem them for discounts on future services!',
      pointsPerBooking: 10,
      pointsPerDollar: 1,
      rewardThreshold: 100,
      rewardAmount: 10,
      isActive: true
    });
    
    console.log('Loyalty program created');
    
    // Generate mock customers
    const customers = [];
    for (let i = 0; i < 20; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      customers.push({
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number('###-###-####')
      });
    }
    
    console.log(`Generated ${customers.length} mock customers`);
    
    // Generate mock bookings
    const bookings = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2); // 2 months ago
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month in future
    
    for (let i = 0; i < 100; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
      const status = generateBookingStatus();
      const appointmentDate = randomDate(startDate, endDate);
      
      // Map service name to valid enum value
      const serviceMap = {
        'Haircut': 'haircut',
        'Hair Coloring': 'coloring',
        'Braids': 'braids',
        'Hair Treatment': 'treatment',
        'Styling': 'styling'
      };
      
      const booking = new Booking({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        service: serviceMap[service.name] || 'consultation',
        serviceId: service._id,
        stylist: staff.name,
        stylistId: staff._id,
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        appointmentTime: generateTimeSlot(),
        status,
        notes: Math.random() > 0.7 ? faker.lorem.sentence() : '',
        serviceDetails: {
          id: service._id,
          name: service.name,
          duration: service.duration,
          price: service.price
        }
      });
      
      bookings.push(booking);
    }
    
    const createdBookings = await Booking.insertMany(bookings);
    console.log(`${createdBookings.length} bookings created`);
    
    // Generate customer loyalty records
    const customerLoyaltyRecords = [];
    const uniqueCustomers = [...new Set(bookings.map(booking => booking.customerEmail))];
    
    for (const email of uniqueCustomers) {
      const customerBookings = bookings.filter(booking => 
        booking.customerEmail === email && booking.status === 'completed'
      );
      
      if (customerBookings.length === 0) continue;
      
      const customerName = customerBookings[0].customerName;
      const totalPointsEarned = customerBookings.length * loyaltyProgram.pointsPerBooking;
      const rewardsRedeemed = Math.floor(Math.random() * (totalPointsEarned / loyaltyProgram.rewardThreshold));
      const pointsRedeemed = rewardsRedeemed * loyaltyProgram.rewardThreshold;
      const currentPoints = totalPointsEarned - pointsRedeemed;
      
      // Get customer phone from their first booking
      const customerPhone = customerBookings[0].customerPhone;
      
      const customerLoyalty = new CustomerLoyalty({
        customerEmail: email,
        customerName,
        customerPhone,
        points: currentPoints,
        totalPointsEarned,
        rewardsRedeemed,
        pointsHistory: []
      });
      
      // Add points history entries
      for (const booking of customerBookings) {
        customerLoyalty.pointsHistory.push({
          type: 'earned',
          points: loyaltyProgram.pointsPerBooking,
          source: 'booking',
          description: `Points earned for ${booking.service} service`,
          createdAt: booking.createdAt
        });
      }
      
      // Add redemption history if any
      for (let i = 0; i < rewardsRedeemed; i++) {
        const redemptionDate = randomDate(
          new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.3),
          new Date()
        );
        
        customerLoyalty.pointsHistory.push({
          type: 'redeemed',
          points: loyaltyProgram.rewardThreshold,
          source: 'reward',
          description: `Redeemed points for $${loyaltyProgram.rewardAmount} discount`,
          createdAt: redemptionDate
        });
      }
      
      // Sort history by date
      customerLoyalty.pointsHistory.sort((a, b) => a.createdAt - b.createdAt);
      
      customerLoyaltyRecords.push(customerLoyalty);
    }
    
    const createdLoyaltyRecords = await CustomerLoyalty.insertMany(customerLoyaltyRecords);
    console.log(`${createdLoyaltyRecords.length} customer loyalty records created`);
    
    // Generate feedback
    const feedbackEntries = [];
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    
    for (const booking of completedBookings) {
      if (Math.random() < 0.7) { // 70% of completed bookings have feedback
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars, weighted towards positive
        const hasComment = Math.random() < 0.6; // 60% have comments
        
        feedbackEntries.push({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          service: booking.service,
          stylist: booking.stylist,
          rating,
          comment: hasComment ? faker.lorem.sentences({ min: 1, max: 3 }) : '',
          createdAt: new Date(new Date(booking.appointmentDate).getTime() + Math.random() * 86400000 * 3) // 0-3 days after appointment
        });
      }
    }
    
    const createdFeedback = await Feedback.insertMany(feedbackEntries);
    console.log(`${createdFeedback.length} feedback entries created`);
    
    console.log('Database seeded with mock data successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedMockData();
