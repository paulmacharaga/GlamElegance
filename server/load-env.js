// Force reload environment variables
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Set each environment variable
for (const key in envConfig) {
  process.env[key] = envConfig[key];
}

console.log('Environment variables loaded successfully');
console.log('Google OAuth credentials:', {
  clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
  clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
  callbackUrlExists: !!process.env.GOOGLE_CALLBACK_URL
});
