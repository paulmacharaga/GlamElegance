// Test script to verify environment variables are loaded correctly
require('dotenv').config();

console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : 'Not found');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Found (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : 'Not found');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not found');
