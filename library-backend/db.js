const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
});

const dbName = "libraryDB";

let db = null;

async function connectDB() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log("✅ Connected to MongoDB successfully");
    }
    
    if (!db) {
      db = client.db(dbName);
      console.log(`✅ Using database: ${dbName}`);
    }
    
    // Test the connection
    await db.admin().ping();
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Closing MongoDB connection...');
  await client.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Closing MongoDB connection...');
  await client.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

module.exports = connectDB;
