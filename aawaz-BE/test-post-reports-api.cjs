const mongoose = require('mongoose');
require('dotenv').config();

// Import models
let Report, AdminEventPost, User;
try {
  Report = require('./models/report.model.js').default;
} catch (e) {
  const reportModule = require('./models/report.model.js');
  Report = reportModule.default || reportModule;
}

try {
  AdminEventPost = require('./admin-panel/models/admin-event-post.model.js').default;
} catch (e) {
  const adminEventPostModule = require('./admin-panel/models/admin-event-post.model.js');
  AdminEventPost = adminEventPostModule.default || adminEventPostModule;
}

try {
  User = require('./models/user.model.js').default;
} catch (e) {
  const userModule = require('./models/user.model.js');
  User = userModule.default || userModule;
}

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/awaaz');
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testPostReportsAPI() {
  try {
    console.log('🔍 Testing Post Reports API logic...');
    
    // Simulate the exact logic from the controller
    const reports = await Report.find({ reportType: 'post' }).lean();
    console.log(`📊 Found ${reports.length} post reports`);

    if (reports.length === 0) {
      console.log('❌ No post reports found with reportType: "post"');
      
      // Check what report types actually exist
      const allReports = await Report.find({});
      const types = [...new Set(allReports.map(r => r.reportType))];
      console.log('📋 Available report types:', types);
      
      // Show sample reports
      allReports.slice(0, 3).forEach((report, index) => {
        console.log(`${index + 1}. reportType: "${report.reportType}", reason: "${report.reason}"`);
      });
      return;
    }

    // Continue with the controller logic
    const groupedReports = reports.reduce((acc, report) => {
      const { postId, userId, reason } = report;
      if (!acc[postId]) {
        acc[postId] = {
          postId,
          reports: [],
        };
      }
      acc[postId].reports.push({ userId, reason });
      return acc;
    }, {});

    const postIds = Object.keys(groupedReports);
    const userIds = [...new Set(reports.map((report) => report.userId))];

    console.log(`📋 Post IDs with reports: ${postIds.length}`);
    console.log(`👥 User IDs involved: ${userIds.length}`);

    const eventPosts = await AdminEventPost.find({ _id: { $in: postIds }}).lean();
    console.log(`📄 Found ${eventPosts.length} corresponding event posts`);

    const users = await User.find({ _id: { $in: userIds } }).lean();
    console.log(`👤 Found ${users.length} corresponding users`);

    const userMap = users.reduce((acc, user) => {
      acc[user._id] = {
        name: user.name,
        profilePicture: user.profilePicture || null,
      };
      return acc;
    }, {});

    const result = postIds.map((postId) => {
      const postDetails = eventPosts.find((post) => post?._id?.toString() === postId?.toString());
      const reportsWithUserData = groupedReports[postId].reports.map((report) => {
        const user = userMap[report.userId];
        return {
          userId: report.userId,
          name: user?.name || "Unknown",
          profilePicture: user?.profilePicture || null,
          reason: report.reason,
        };
      });
      return {
        postId,
        postImage: postDetails?.attachments?.[0]?.attachment || null,
        thumbnail: postDetails?.attachments?.[0]?.thumbnail || null,
        reportedCounts: reportsWithUserData?.length || 0,
        latestReportedReason: reportsWithUserData && reportsWithUserData[0] && reportsWithUserData[0]?.reason,
        isDeleted: postDetails?.deleted?.isDeleted,
        reports: reportsWithUserData,
      };
    });

    const filteredResponse = result?.filter((v)=> v?.isDeleted === false);
    
    console.log(`📤 Final result (before filter): ${result.length} items`);
    console.log(`📤 Final result (after filter): ${filteredResponse.length} items`);
    
    if (filteredResponse.length > 0) {
      console.log('📝 Sample result:');
      console.log(JSON.stringify(filteredResponse[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    mongoose.disconnect();
  }
}

connectDB().then(() => {
  testPostReportsAPI();
});
