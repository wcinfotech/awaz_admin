import mongoose from 'mongoose';
import config from './config/config.js';

const checkTestEventPostType = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Check the test event
    const eventId = '69735f09dbd8506b782e4c5a';
    console.log(`\n=== Checking Test Event: ${eventId} ===`);
    
    const event = await db.collection('eventposts').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
    
    if (event) {
      console.log('✅ Event found!');
      console.log('Title:', event.title);
      console.log('PostType:', event.postType);
      console.log('Status:', event.status);
      console.log('All fields:', Object.keys(event));
    } else {
      console.log('❌ Event not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkTestEventPostType();
