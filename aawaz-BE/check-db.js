import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB');
  
  // Check AdminEventPost collection
  const adminEventPosts = await mongoose.connection.db.collection('admineventposts').find({}).limit(5).toArray();
  console.log('\n=== AdminEventPost Records ===');
  console.log('Count:', adminEventPosts.length);
  if (adminEventPosts.length > 0) {
    adminEventPosts.forEach((p, i) => {
      console.log(`\n[${i+1}] _id: ${p._id}`);
      console.log('    postType:', p.postType);
      console.log('    title:', p.title);
      console.log('    status:', p.status);
      console.log('    deleted:', JSON.stringify(p.deleted));
    });
  }
  
  // Check EventPost collection (user posts)
  const eventPosts = await mongoose.connection.db.collection('eventposts').find({}).limit(5).toArray();
  console.log('\n=== EventPost Records (User Posts) ===');
  console.log('Count:', eventPosts.length);
  if (eventPosts.length > 0) {
    eventPosts.forEach((p, i) => {
      console.log(`\n[${i+1}] _id: ${p._id}`);
      console.log('    postType:', p.postType);
      console.log('    title:', p.title || p.additionalDetails);
      console.log('    status:', p.status);
    });
  }
  
  // Get total counts
  const adminCount = await mongoose.connection.db.collection('admineventposts').countDocuments({});
  const userCount = await mongoose.connection.db.collection('eventposts').countDocuments({});
  console.log('\n=== Total Counts ===');
  console.log('AdminEventPost:', adminCount);
  console.log('EventPost:', userCount);
  
  // Check distinct postType values
  const adminPostTypes = await mongoose.connection.db.collection('admineventposts').distinct('postType');
  const userPostTypes = await mongoose.connection.db.collection('eventposts').distinct('postType');
  console.log('\n=== Distinct postType Values ===');
  console.log('AdminEventPost postTypes:', adminPostTypes);
  console.log('EventPost postTypes:', userPostTypes);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
