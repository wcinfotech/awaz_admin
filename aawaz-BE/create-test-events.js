import mongoose from 'mongoose';
import config from './config/config.js';

const createTestEventWithPostType = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("Connected to database");
    
    const db = mongoose.connection.db;
    
    // Create test events for different postTypes
    const testEvents = [
      {
        title: "Test Incident Event",
        additionalDetails: "This is a test incident event",
        address: "Test Incident Address",
        latitude: "21.2247194",
        longitude: "72.806996",
        hashTags: ["#test", "#incident"],
        attachment: "https://example.com/test-incident.jpg",
        attachmentFileType: "image/jpeg",
        postCategoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        postType: "incident",
        status: "Pending",
        createdAt: new Date(),
        eventTime: new Date(),
        reactionCounts: 5,
        sharedCount: 1,
        viewCounts: 20,
        commentCounts: 2
      },
      {
        title: "Test Rescue Event",
        additionalDetails: "This is a test rescue event",
        address: "Test Rescue Address",
        latitude: "21.2247194",
        longitude: "72.806996",
        hashTags: ["#test", "#rescue"],
        attachment: "https://example.com/test-rescue.mp4",
        thumbnail: "https://example.com/test-rescue-thumb.jpg",
        attachmentFileType: "video/mp4",
        postCategoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        postType: "rescue",
        status: "Pending",
        createdAt: new Date(),
        eventTime: new Date(),
        reactionCounts: 10,
        sharedCount: 2,
        viewCounts: 40,
        commentCounts: 5
      },
      {
        title: "Test General Category Event",
        additionalDetails: "This is a test general category event",
        address: "Test General Address",
        latitude: "21.2247194",
        longitude: "72.806996",
        hashTags: ["#test", "#general"],
        attachment: "https://example.com/test-general.jpg",
        attachmentFileType: "image/jpeg",
        postCategoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        postType: "general_category",
        status: "Pending",
        createdAt: new Date(),
        eventTime: new Date(),
        reactionCounts: 8,
        sharedCount: 3,
        viewCounts: 30,
        commentCounts: 4
      }
    ];
    
    console.log('Creating test events...');
    
    for (const [index, testEvent] of testEvents.entries()) {
      const result = await db.collection('eventposts').insertOne(testEvent);
      console.log(`✅ ${testEvent.postType} event created with ID: ${result.insertedId}`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

createTestEventWithPostType();
