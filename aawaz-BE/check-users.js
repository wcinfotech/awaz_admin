import mongoose from 'mongoose';
import config from './config/config.js';

const checkAdminUsers = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Check admin users collection
    const adminUsers = await db.collection('adminusers').find({}).toArray();
    console.log('\n=== ADMIN USERS ===');
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check regular users collection
    const regularUsers = await db.collection('users').find({}).limit(5).toArray();
    console.log('\n=== REGULAR USERS (first 5) ===');
    console.log(`Found ${regularUsers.length} regular users:`);
    regularUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Username: ${user.username}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkAdminUsers();
