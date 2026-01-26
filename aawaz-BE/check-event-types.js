import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models to check event types
import AdminEventType from './admin-panel/models/admin-event-type.model.js';
import EventPost from './models/event-post.model.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB');
  
  console.log('\n=== Checking Event Types in Database ===');
  
  // Check AdminEventType collection
  const eventTypes = await AdminEventType.find({});
  console.log('\nAdminEventType collection:', eventTypes.length, 'records');
  eventTypes.forEach(type => {
    console.log(`- ${type._id}: ${type.name} (${type.postType || 'N/A'})`);
  });
  
  console.log('\n=== Checking EventPost Records ===');
  
  // Check some EventPost records to see their postCategoryId
  const eventPosts = await EventPost.find({ postType: 'incident' }).limit(5);
  console.log('\nEventPost records with postType="incident":');
  eventPosts.forEach(post => {
    console.log(`- ${post._id}: ${post.title || 'No title'}`);
    console.log(`  postCategoryId: ${post.postCategoryId}`);
    console.log(`  postType: ${post.postType}`);
    console.log(`  status: ${post.status}`);
    console.log('');
  });
  
  // Check counts by postType
  console.log('\n=== EventPost Counts by Type ===');
  const incidentCount = await EventPost.countDocuments({ postType: 'incident' });
  const rescueCount = await EventPost.countDocuments({ postType: 'rescue' });
  const generalCount = await EventPost.countDocuments({ postType: 'general_category' });
  
  console.log(`Incident: ${incidentCount}`);
  console.log(`Rescue: ${rescueCount}`);
  console.log(`General Category: ${generalCount}`);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
