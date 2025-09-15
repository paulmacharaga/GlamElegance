# Glam Elegance Booking - QR Code Management System

A comprehensive web application for beauty salons to manage customer interactions through QR codes, featuring Google Reviews integration, private feedback collection, and appointment booking.

## Features

### 🎯 **QR Code Integration**
- Generate unique QR codes for in-salon display
- Mobile-optimized landing page with 3 main options
- Analytics tracking for QR code scans

### ⭐ **Google Reviews**
- Direct integration with Google Business reviews
- One-click review submission using Place ID
- Track review click analytics

### 💬 **Private Feedback System**
- 1-5 star rating system
- Optional comment collection
- Anonymous feedback option
- Service and stylist-specific feedback

### 📅 **Appointment Booking**
- Service selection (haircut, braids, coloring, etc.)
- Stylist preference (optional)
- Calendar-based date picker
- Real-time availability checking
- Email confirmation system

### 👨‍💼 **Admin Dashboard**
- Staff login with role-based access
- Booking management and status updates
- Feedback review and analytics
- QR code generation and printing
- Comprehensive analytics dashboard

## Tech Stack

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Email**: Nodemailer
- **QR Codes**: qrcode library
- **Date Handling**: Day.js

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Gmail account for email notifications (optional)

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm run install-all
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hairstudio

# JWT Secret (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret_here

# Client URL
CLIENT_URL=http://localhost:3000

# Google Business Place ID (required for Google Reviews)
GOOGLE_PLACE_ID=your_google_place_id_here

# Email Configuration (optional - for booking confirmations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Google Place ID Setup

1. Go to [Google My Business](https://business.google.com/)
2. Find your business listing
3. Get your Place ID from [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
4. Add it to your `.env` file

### 4. Create React Environment File

Create `client/.env`:

```env
REACT_APP_GOOGLE_PLACE_ID=your_google_place_id_here
```

## Running the Application

### Development Mode

```bash
# Start both frontend and backend
npm run dev

# Or run separately:
npm run server  # Backend only (port 5000)
npm run client  # Frontend only (port 3000)
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
cd server && npm start
```

## Default Admin Account

For testing purposes, create an admin account:

```bash
# In the MongoDB shell or using a MongoDB client
db.users.insertOne({
  username: "admin",
  email: "admin@hairstudio.com",
  password: "$2a$10$rOzJl5Lz5Lz5Lz5Lz5Lz5O", // bcrypt hash for "admin123"
  name: "Admin User",
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```

Or register through the admin interface at `/admin`.

## Usage Guide

### For Salon Staff

1. **Generate QR Code**:
   - Login to admin panel (`/admin`)
   - Go to QR Generator
   - Download and print QR code
   - Place in visible salon locations

2. **Manage Bookings**:
   - View all appointments in admin dashboard
   - Update booking status (pending → confirmed → completed)
   - Access customer contact information

3. **Review Feedback**:
   - Monitor customer ratings and comments
   - Filter feedback by service or rating
   - Track average ratings over time

### For Customers

1. **Scan QR Code**: Use phone camera to scan
2. **Choose Action**:
   - Leave Google Review
   - Share Private Feedback
   - Book Appointment
3. **Complete Process**: Follow simple 2-tap flow

## API Endpoints

### Authentication
- `POST /api/auth/login` - Staff login
- `POST /api/auth/register` - Register staff account
- `GET /api/auth/me` - Get current user

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings (admin)
- `PATCH /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/availability/:date` - Get available time slots

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin)
- `GET /api/feedback/stats` - Get feedback statistics

### QR & Analytics
- `GET /api/qr/generate` - Generate QR code
- `POST /api/qr/scan` - Track QR scan
- `POST /api/qr/google-review-click` - Track review clicks
- `GET /api/analytics/dashboard` - Get analytics data

## Customization

### Salon Branding
- Update colors in `client/src/App.js` theme configuration
- Replace salon name throughout the application
- Customize service types in booking forms

### Services Configuration
Edit services array in:
- `client/src/components/BookingForm.js`
- `client/src/components/FeedbackForm.js`
- `server/models/Booking.js`

### Business Hours
Modify available time slots in:
- `server/routes/bookings.js` (availableSlots array)

## Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Password hashing with bcrypt

## Mobile Optimization

- Responsive Material-UI components
- Touch-friendly interface
- Optimized for phone cameras (QR scanning)
- Progressive Web App ready

## Deployment

### Using Netlify/Vercel (Frontend)
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Set environment variables in hosting platform

### Using Heroku (Full Stack)
1. Create Heroku app
2. Set environment variables
3. Deploy using Git or GitHub integration

### Using DigitalOcean/AWS
1. Set up MongoDB instance
2. Deploy backend to server
3. Serve React build files

## Troubleshooting

### Common Issues

1. **QR Code not generating**: Check JWT token and admin authentication
2. **Email not sending**: Verify Gmail app password and SMTP settings
3. **Booking conflicts**: Ensure date/time validation is working
4. **Google Reviews not opening**: Verify Place ID is correct

### Database Issues

```bash
# Reset database (development only)
mongo hairstudio --eval "db.dropDatabase()"
```

### Logs

```bash
# View server logs
cd server && npm run dev

# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support or questions:
- Create an issue in the repository
- Email: support@hairstudio.com
- Documentation: [Project Wiki](link-to-wiki)

---

**Built with ❤️ for the beauty industry**
