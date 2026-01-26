import config from './config/config.js';

console.log('=== CURRENT DATABASE CONNECTION ===');
console.log('MongoDB URL:', config.mongodb.url);
console.log('Database Options:', config.mongodb.options);
console.log('Environment:', config.nodeEnv);
console.log('=====================================');

process.exit(0);
