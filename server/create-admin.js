const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for creating admin user'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Admin user data
const adminUser = {
  username: 'admin',
  email: 'admin@hairstudio.com',
  password: 'admin123',
  name: 'Admin User',
  role: 'admin',
  isActive: true
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingUser = await User.findOne({
      $or: [{ email: adminUser.email }, { username: adminUser.username }]
    });

    if (existingUser) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create new admin user
    const user = new User(adminUser);
    await user.save();
    
    console.log('Admin user created successfully');
    console.log('Username:', adminUser.username);
    console.log('Password:', adminUser.password);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the create admin function
createAdminUser();
