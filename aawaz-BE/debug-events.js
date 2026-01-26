import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL;

async function debugEvents() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Get collections
    const db = mongoose.connection.db;

    // Count EventPost documents
    const eventPosts = await db.collection('eventposts').find({}).toArray();
    console.log('=== EventPost Collection ===');
    console.log('Total documents:', eventPosts.length);
    
    // Group by postType
    const byPostType = {};
    eventPosts.forEach(post => {
      const pt = post.postType || 'undefined';
      byPostType[pt] = (byPostType[pt] || 0) + 1;
    });
    console.log('By postType:', byPostType);

    // Group by status
    const byStatus = {};
    eventPosts.forEach(post => {
      const st = post.status || 'undefined';
      byStatus[st] = (byStatus[st] || 0) + 1;
    });
    console.log('By status:', byStatus);

    // Sample document
    if (eventPosts.length > 0) {
      console.log('\nSample EventPost document:');
      console.log(JSON.stringify(eventPosts[0], null, 2));
    }

    // Count AdminEventPost documents
    console.log('\n=== AdminEventPost Collection ===');
    const adminEventPosts = await db.collection('admineventposts').find({}).toArray();
    console.log('Total documents:', adminEventPosts.length);

    // Group by postType
    const adminByPostType = {};
    adminEventPosts.forEach(post => {
      const pt = post.postType || 'undefined';
      adminByPostType[pt] = (adminByPostType[pt] || 0) + 1;
    });
    console.log('By postType:', adminByPostType);

    // Check deleted status
    const adminByDeleted = {};
    adminEventPosts.forEach(post => {
      const del = post.deleted?.isDeleted === true ? 'deleted' : 'active';
      adminByDeleted[del] = (adminByDeleted[del] || 0) + 1;
    });
    console.log('By deleted status:', adminByDeleted);

    // Sample document
    if (adminEventPosts.length > 0) {
      console.log('\nSample AdminEventPost document:');
      console.log(JSON.stringify(adminEventPosts[0], null, 2));
    }

    // Test the exact query the controller uses
    console.log('\n=== Testing Controller Query ===');
    const testQuery = {
      postType: 'incident',
      status: { $in: ['Pending', 'Rejected'] }
    };
    console.log('Query:', JSON.stringify(testQuery));
    const testResults = await db.collection('eventposts').find(testQuery).toArray();
    console.log('Results count:', testResults.length);

    // Test AdminEventPost query
    const adminTestQuery = {
      postType: 'incident',
      'deleted.isDeleted': false
    };
    console.log('\nAdminEventPost Query:', JSON.stringify(adminTestQuery));
    const adminTestResults = await db.collection('admineventposts').find(adminTestQuery).toArray();
    console.log('Results count:', adminTestResults.length);

    // Also test without deleted filter
    const adminTestQuery2 = {
      postType: 'incident'
    };
    console.log('\nAdminEventPost Query (no deleted filter):', JSON.stringify(adminTestQuery2));
    const adminTestResults2 = await db.collection('admineventposts').find(adminTestQuery2).toArray();
    console.log('Results count:', adminTestResults2.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugEvents();
