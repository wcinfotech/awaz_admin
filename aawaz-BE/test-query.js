import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import AdminEventPost from './admin-panel/models/admin-event-post.model.js';
import EventPost from './models/event-post.model.js';
import enums from './config/enum.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB');
  
  const postType = 'incident';
  
  console.log('\n=== Testing Query with postType:', postType, '===');
  
  // Test EventPost query (pending/rejected)
  const pendingRejected = await EventPost.find({
    postType: postType,
    status: {
      $in: [
        enums.eventPostStatusEnum.PENDING,
        enums.eventPostStatusEnum.REJECTED
      ]
    }
  }).limit(10);
  
  console.log('\nEventPost (Pending/Rejected):', pendingRejected.length);
  pendingRejected.forEach(p => {
    console.log(`  - ${p._id}: ${p.title || p.additionalDetails} (${p.status})`);
  });
  
  // Test AdminEventPost query (all non-deleted)
  const adminPosts = await AdminEventPost.find({
    postType: postType,
    'deleted.isDeleted': false
  }).limit(10);
  
  console.log('\nAdminEventPost (not deleted):', adminPosts.length);
  adminPosts.forEach(p => {
    console.log(`  - ${p._id}: ${p.title} (status: ${p.status})`);
  });
  
  // Check enum values
  console.log('\n=== Enum Values ===');
  console.log('eventPostStatusEnum:', enums.eventPostStatusEnum);
  console.log('eventPostTypeEnum:', enums.eventPostTypeEnum);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
