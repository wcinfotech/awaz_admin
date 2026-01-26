import mongoose from 'mongoose';
import config from './config/config.js';

const createTestEvent = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Create a test event
    const testEvent = {
      title: "Test Fire Event",
      additionalDetails: "This is a test fire event for admin panel",
      address: "Test Address, Test City",
      latitude: "21.2247194",
      longitude: "72.806996",
      hashTags: ["#test", "#fire"],
      attachment: "https://example.com/test-video.mp4",
      thumbnail: "https://example.com/test-thumbnail.jpg",
      attachmentFileType: "video/mp4",
      postCategoryId: new mongoose.Types.ObjectId(), // Will create a dummy one
      userId: new mongoose.Types.ObjectId(), // Will create a dummy one
      createdAt: new Date(),
      eventTime: new Date(),
      reactionCounts: 10,
      sharedCount: 2,
      viewCounts: 40,
      commentCounts: 5
    };
    
    // Insert the test event
    const result = await db.collection('eventposts').insertOne(testEvent);
    console.log('✅ Test event created with ID:', result.insertedId);
    
    // Test the new endpoint with this event
    console.log('\n=== Testing New Endpoint ===');
    console.log(`Event ID: ${result.insertedId}`);
    console.log(`URL: http://localhost:5000/admin/v1/event-post/incident/${result.insertedId}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

createTestEvent();
