import mongoose from 'mongoose';
import config from './config/config.js';

const checkAllEventCollections = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Check eventposts collection
    const userPosts = await db.collection('eventposts').find({}).limit(3).toArray();
    console.log(`\n=== USER POSTS (eventposts): ${userPosts.length} ===`);
    userPosts.forEach((post, index) => {
      console.log(`${index + 1}. ID: ${post._id}, Title: ${post.title || 'No title'}`);
    });
    
    // Check admineventposts collection
    const adminPosts = await db.collection('admineventposts').find({}).limit(3).toArray();
    console.log(`\n=== ADMIN POSTS (admineventposts): ${adminPosts.length} ===`);
    adminPosts.forEach((post, index) => {
      console.log(`${index + 1}. ID: ${post._id}, Title: ${post.title || 'No title'}`);
    });
    
    // Check drafteventposts collection
    const draftPosts = await db.collection('drafteventposts').find({}).limit(3).toArray();
    console.log(`\n=== DRAFT POSTS (drafteventposts): ${draftPosts.length} ===`);
    draftPosts.forEach((post, index) => {
      console.log(`${index + 1}. ID: ${post._id}, Title: ${post.title || 'No title'}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkAllEventCollections();
