import mongoose from 'mongoose';
import config from './config/config.js';

const checkSpecificEvent = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Check the specific event ID
    const eventId = '69724ddbe73bfb8617fff50d';
    console.log(`\n=== Checking Event ID: ${eventId} ===`);
    
    const event = await db.collection('eventposts').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
    
    if (event) {
      console.log('✅ Event found!');
      console.log('Title:', event.title);
      console.log('Created:', event.createdAt);
      console.log('User ID:', event.userId);
    } else {
      console.log('❌ Event not found in eventposts collection');
      
      // Check if it exists in admin collection
      const adminEvent = await db.collection('admineventposts').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
      if (adminEvent) {
        console.log('✅ Event found in admineventposts collection');
        console.log('Title:', adminEvent.title);
      } else {
        console.log('❌ Event not found in any collection');
        
        // List recent events for comparison
        const recentEvents = await db.collection('eventposts').find({}).limit(3).toArray();
        console.log('\n=== Recent Events for Reference ===');
        recentEvents.forEach((evt, index) => {
          console.log(`${index + 1}. ID: ${evt._id}, Title: ${evt.title}`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkSpecificEvent();
