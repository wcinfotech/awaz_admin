import mongoose from 'mongoose';
import config from './config/config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Database connection established");
    
    // Check recent posts
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n=== AVAILABLE COLLECTIONS ===');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check event posts collection
    if (collections.find(c => c.name === 'eventposts')) {
      const recentPosts = await db.collection('eventposts')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log('\n=== RECENT 5 POSTS ===');
      recentPosts.forEach((post, index) => {
        console.log(`${index + 1}. Title: ${post.title || 'No title'}`);
        console.log(`   Created: ${post.createdAt || post.eventTime || 'No timestamp'}`);
        console.log(`   ID: ${post._id}`);
        console.log('---');
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`Error:`, error);
  }
};

connectDB();
