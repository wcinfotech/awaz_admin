const mongoose = require('mongoose');
require('dotenv').config();

// Import models - handle ES6 export
let Report;
try {
  Report = require('./models/report.model.js').default;
} catch (e) {
  // Fallback for different export structures
  const reportModule = require('./models/report.model.js');
  Report = reportModule.default || reportModule;
}

// Connect to database using the same connection as the app
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/awaaz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function checkReports() {
  try {
    console.log('🔍 Checking for existing reports...');
    
    // Check all reports
    const allReports = await Report.find({});
    console.log(`📊 Total reports in database: ${allReports.length}`);
    
    if (allReports.length > 0) {
      console.log('📋 Report types found:');
      const reportTypes = {};
      allReports.forEach(report => {
        reportTypes[report.reportType] = (reportTypes[report.reportType] || 0) + 1;
      });
      console.log(reportTypes);
      
      console.log('📝 Sample reports:');
      allReports.slice(0, 3).forEach((report, index) => {
        console.log(`${index + 1}. Type: ${report.reportType}, Reason: ${report.reason}, Status: ${report.status}`);
      });
    } else {
      console.log('❌ No reports found in database');
      
      // Create some test reports
      console.log('🔧 Creating test reports...');
      
      const testReports = [
        {
          userId: new mongoose.Types.ObjectId(),
          postId: 'test-post-1',
          reason: 'Inappropriate content',
          reportType: 'post',
          status: 'open'
        },
        {
          userId: new mongoose.Types.ObjectId(),
          postId: 'test-post-2', 
          reason: 'Spam content',
          reportType: 'post',
          status: 'open'
        },
        {
          userId: new mongoose.Types.ObjectId(),
          commentId: 'test-comment-1',
          reason: 'Offensive language',
          reportType: 'comment',
          status: 'open'
        },
        {
          userId: new mongoose.Types.ObjectId(),
          reportedUserId: new mongoose.Types.ObjectId(),
          reason: 'Fake profile',
          reportType: 'user',
          status: 'open'
        }
      ];
      
      const inserted = await Report.insertMany(testReports);
      console.log(`✅ Created ${inserted.length} test reports`);
    }
    
  } catch (error) {
    console.error('❌ Error checking reports:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the check
connectDB().then(() => {
  checkReports();
});
