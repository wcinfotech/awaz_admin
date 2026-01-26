import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import AdminEventType from './admin-panel/models/admin-event-type.model.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB');
  
  console.log('\n=== Event Types with Proper Fields ===');
  
  const eventTypes = await AdminEventType.find({});
  console.log(`Found ${eventTypes.length} event types:\n`);
  
  eventTypes.forEach(type => {
    console.log(`ID: ${type._id}`);
    console.log(`Name: ${type.eventName}`);
    console.log(`Post Type: ${type.postType}`);
    console.log(`Icon: ${type.eventIcon}`);
    console.log(`Notification Name: ${type.notificationCategotyName}`);
    console.log(`Sub Categories: ${type.subCategories?.length || 0}`);
    console.log('---');
  });
  
  // Group by postType
  console.log('\n=== Grouped by Post Type ===');
  const grouped = eventTypes.reduce((acc, type) => {
    if (!acc[type.postType]) acc[type.postType] = [];
    acc[type.postType].push(type);
    return acc;
  }, {});
  
  Object.keys(grouped).forEach(postType => {
    console.log(`\n${postType} (${grouped[postType].length} types):`);
    grouped[postType].forEach(type => {
      console.log(`  - ${type.eventName} (${type._id})`);
    });
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
