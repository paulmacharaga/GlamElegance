const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
        googleId: true
      }
    });
    
    if (!user) {
      return done(new Error('User not found'), null);
    }
    
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
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
          const email = profile.emails?.[0]?.value || `${profile.id}@google.com`;
          const name = profile.displayName || 'Google User';
          const avatar = profile.photos?.[0]?.value || null;
          const username = `google_${profile.id}`;
          
          // Check if user already exists with this Google ID
          let user = await prisma.user.findFirst({
            where: { googleId: profile.id }
          });
          
          if (user) {
            // Update user's Google profile information
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleProfile: profile,
                avatar: avatar
              },
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                avatar: true,
                googleId: true
              }
            });
            return done(null, user);
          }
          
          // Check if user exists with the same email
          if (email) {
            user = await prisma.user.findFirst({
              where: { email }
            });
            
            if (user) {
              // Link Google account to existing user
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  googleProfile: profile,
                  avatar: avatar
                },
                select: {
                  id: true,
                  username: true,
                  email: true,
                  name: true,
                  role: true,
                  isActive: true,
                  avatar: true,
                  googleId: true
                }
              });
              return done(null, user);
            }
          }
          
          // Create new user if doesn't exist
          const newUser = await prisma.user.create({
            data: {
              username: username,
              email: email,
              name: name,
              googleId: profile.id,
              googleProfile: profile,
              avatar: avatar,
              role: 'staff', // Default role for Google sign-ins
              isActive: true,
              password: '' // Google-authenticated users don't need a password
            },
            select: {
              id: true,
              username: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              avatar: true,
              googleId: true
            }
          });
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
