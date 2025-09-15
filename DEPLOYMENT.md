# 🚀 Deployment Guide - Vercel & Neon

This guide will help you deploy your Glam Elegance application to Vercel with Neon PostgreSQL or MongoDB Atlas.

## 🌟 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- Database (MongoDB Atlas or Neon PostgreSQL)

### Step 1: Fork Repository
1. Fork this repository to your GitHub account
2. Clone your fork locally (optional)

### Step 2: Database Setup

#### ✅ MongoDB Atlas (Pre-configured)
**Database is already set up and ready to use!**

- **Cluster**: `glamelagance.ymezrea.mongodb.net`
- **Database**: `glam-elegance-booking`
- **User**: `Vercel-Admin-Glamelagance`
- **Status**: ✅ Connected and tested
- **Connection**: Optimized for Vercel serverless deployment

The MongoDB Atlas database is fully configured with:
- ✅ **Collections ready**: bookings, feedback, users, services, staff
- ✅ **Indexes optimized**: For fast queries and performance
- ✅ **Security configured**: Proper authentication and access controls
- ✅ **Serverless ready**: Connection pooling and timeout handling

#### Alternative: Neon PostgreSQL (Optional)
If you prefer PostgreSQL:
1. Go to [Neon](https://neon.tech)
2. Create a free account and database
3. Get your connection string and update environment variables
   Note: You'll need to implement PostgreSQL models (currently uses MongoDB)

### Step 3: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your forked repository
4. Configure the following settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/build`

### Step 4: Environment Variables

Add these environment variables in Vercel:

#### Required Variables
```env
MONGODB_URI=mongodb+srv://Vercel-Admin-Glamelagance:mfg5D58Xk8EQktJa@glamelagance.ymezrea.mongodb.net/glam-elegance-booking?retryWrites=true&w=majority
JWT_SECRET=glam_elegance_super_secret_jwt_key_2024_production_ready
NODE_ENV=production
```

#### Optional Variables
```env
# For Neon PostgreSQL (if using instead of MongoDB)
DATABASE_URL=your_neon_connection_string

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-app-name.vercel.app/api/auth/google/callback

# Email notifications (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google Business (for reviews)
GOOGLE_PLACE_ID=your_google_place_id
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/build"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/$1"
    }
  ]
}
```

## 🎯 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Database connection works
- [ ] Admin login functions (paul@ioi.co.zw / Letmein99x!)
- [ ] QR code generation works
- [ ] Booking system functions
- [ ] Feedback submission works
- [ ] All API endpoints respond correctly

## 👤 Admin Access

**Admin Login Credentials:**
- **Email**: `paul@ioi.co.zw`
- **Password**: `Letmein99x!`
- **Role**: Administrator
- **Status**: ✅ Active and ready

**Admin Dashboard Features:**
- 📊 View all bookings and appointments
- 💬 Manage customer feedback and reviews
- 📱 Generate QR codes for customer access
- 👥 Manage staff and services
- 📈 View analytics and business metrics

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are installed
   - Verify `vercel-build` script exists in package.json

2. **Database Connection Fails**
   - Verify connection string is correct
   - Check that IP whitelist includes 0.0.0.0/0 (for MongoDB Atlas)
   - Ensure database user has proper permissions

3. **API Routes Not Working**
   - Check vercel.json routing configuration
   - Verify api/index.js correctly imports server/index.js
   - Ensure server/index.js exports the app correctly

4. **Environment Variables Not Loading**
   - Double-check variable names in Vercel dashboard
   - Ensure no trailing spaces in values
   - Redeploy after adding new variables

### Logs and Debugging

1. **View Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Click on a function to view logs

2. **Runtime Logs**:
   - Use `console.log()` statements in your code
   - View logs in Vercel dashboard

## 🔄 Updates and Redeployment

### Automatic Deployment
- Push changes to your main branch
- Vercel automatically rebuilds and deploys

### Manual Deployment
- Go to Vercel Dashboard → Your Project
- Click "Redeploy" on latest deployment

## 🌐 Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update environment variables with new domain

## 📊 Monitoring

### Vercel Analytics
- Enable analytics in project settings
- Monitor performance and usage

### Database Monitoring
- **MongoDB Atlas**: Built-in monitoring dashboard
- **Neon**: Performance insights in dashboard

## 🔒 Security Considerations

- [ ] Environment variables are properly set
- [ ] Database has proper access controls
- [ ] JWT secret is secure and random
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (if needed)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel documentation
3. Check database provider documentation
4. Create an issue in the GitHub repository

---

**Happy Deploying! 🎉**

Your Glam Elegance application should now be live and accessible to customers worldwide!
