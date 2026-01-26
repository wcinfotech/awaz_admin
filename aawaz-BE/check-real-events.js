import mongoose from 'mongoose';
import config from './config/config.js';

const checkRealEventsWithMedia = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Check real events with attachments
    const eventsWithMedia = await db.collection('eventposts').find({
      attachment: { $exists: true, $ne: null, $ne: "" }
    }).limit(5).toArray();
    
    console.log(`\n=== EVENTS WITH ATTACHMENTS (${eventsWithMedia.length}) ===`);
    eventsWithMedia.forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event._id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   PostType: ${event.postType}`);
      console.log(`   Attachment: ${event.attachment}`);
      console.log(`   Attachment Type: ${event.attachmentFileType}`);
      console.log(`   Thumbnail: ${event.thumbnail}`);
      console.log('---');
    });
    
    // Check all recent events to see what's missing
    const allRecentEvents = await db.collection('eventposts').find({}).limit(5).toArray();
    console.log(`\n=== ALL RECENT EVENTS (${allRecentEvents.length}) ===`);
    allRecentEvents.forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event._id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Has Attachment: ${!!event.attachment}`);
      console.log(`   Attachment: ${event.attachment || 'None'}`);
      console.log('---');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkRealEventsWithMedia();
