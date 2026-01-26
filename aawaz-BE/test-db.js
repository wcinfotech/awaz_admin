import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eagleawaz')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get collections
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('\n=== ALL COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
