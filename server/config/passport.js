const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Only configure Google OAuth Strategy if credentials are available
const googleCredentialsAvailable = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET && 
  process.env.GOOGLE_CALLBACK_URL;

// Debug logging for OAuth credentials
console.log('Google OAuth credentials check:', {
  clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
  clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
  callbackUrlExists: !!process.env.GOOGLE_CALLBACK_URL,
  credentialsAvailable: googleCredentialsAvailable
});

if (googleCredentialsAvailable) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            // Update user's Google profile information
            user.googleProfile = profile;
            user.avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
            await user.save();
            return done(null, user);
          }
          
          // Check if user exists with the same email
          if (profile.emails && profile.emails.length > 0) {
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.googleProfile = profile;
              user.avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
              await user.save();
              return done(null, user);
            }
          }
          
          // Create new user if doesn't exist
          const newUser = new User({
            username: `google_${profile.id}`,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
            name: profile.displayName || '',
            googleId: profile.id,
            googleProfile: profile,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            role: 'staff', // Default role for Google sign-ins
            isActive: true
          });
          
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('Google OAuth credentials not found. Google authentication is disabled.');
}

module.exports = passport;
