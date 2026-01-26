const connectDB = require('./db');

async function testDatabase() {
  try {
    console.log('🔍 Testing MongoDB connection...\n');
    
    const db = await connectDB();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Count documents in each collection
    console.log('\n📊 Document counts:');
    const collectionNames = ['users', 'books', 'requests', 'borrows', 'favorites'];
    
    for (const colName of collectionNames) {
      try {
        const count = await db.collection(colName).countDocuments();
        console.log(`   - ${colName}: ${count} documents`);
      } catch (err) {
        console.log(`   - ${colName}: Error counting - ${err.message}`);
      }
    }
    
    // Test a simple query
    console.log('\n🔎 Testing queries:');
    const userCount = await db.collection('users').countDocuments();
    const bookCount = await db.collection('books').countDocuments();
    
    console.log(`   - Users found: ${userCount}`);
    console.log(`   - Books found: ${bookCount}`);
    
    if (userCount > 0) {
      const admin = await db.collection('users').findOne({ role: 'admin' });
      if (admin) {
        console.log(`   - Admin user exists: ${admin.username}`);
      }
    }
    
    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('   Error:', error.message);
    console.error('\n💡 Make sure MongoDB is running:');
    console.error('   - Windows: Check if MongoDB service is running');
    console.error('   - Or start MongoDB manually: mongod');
    process.exit(1);
  }
}

testDatabase();
