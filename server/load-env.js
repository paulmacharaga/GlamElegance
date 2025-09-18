// Load environment variables conditionally
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Check if .env file exists (for local development)
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  // Local development - load from .env file
  const envConfig = dotenv.parse(fs.readFileSync(envPath));

  // Set each environment variable
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  console.log('Environment variables loaded from .env file');
} else {
  // Production (Vercel) - environment variables are already available
  console.log('Using platform environment variables (Vercel)');
}

// Verify critical environment variables are available
const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
} else {
  console.log('All required environment variables are available');
  
  // Check if SQLite database file exists
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const dbPath = process.env.DATABASE_URL.replace('file:', '').trim();
    const dbFullPath = path.resolve(__dirname, dbPath);
    
    if (!fs.existsSync(dbFullPath)) {
      console.warn(`Warning: SQLite database file not found at ${dbFullPath}`);
      console.warn('A new database will be created when the server starts');
    }
  }
}

console.log('Google OAuth credentials:', {
  clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
  clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
  callbackUrlExists: !!process.env.GOOGLE_CALLBACK_URL
});
