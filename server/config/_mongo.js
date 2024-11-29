import { MongoClient } from 'mongodb';

// MongoDB connection URI
const uri = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/";
const client = new MongoClient(uri);

/**
 * Connects to MongoDB and returns the client and the collections.
 * @returns {Promise<[MongoClient, Collection, Collection]>} The connected MongoDB client and the collections.
 */
export async function connectToDatabase() {
  try {
    await client.connect();
    const db = client.db('snaptalk');
    const users_collection = db.collection('users');
    const data_collection = db.collection('data');

    // Check if the connection is successful
    const pingResult = await db.command({ ping: 1 });

    // Log success if ping is successful
    if (pingResult.ok === 1) {
      console.log('MongoDB is connected.');

      // Check collections
      try {
        // Check if users_collection is accessible
        await users_collection.findOne();
        console.log('users_collection is connected.');
      } catch (err) {
        console.error('Error accessing users_collection:', err);
      }

      try {
        // Check if data_collection is accessible
        await data_collection.findOne();
        console.log('data_collection is connected.');
      } catch (err) {
        console.error('Error accessing data_collection:', err);
      }
    }

    return [client, users_collection, data_collection]; // Return client and collections
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error; // Ensure the error is thrown so the caller can handle it
  }
}

// Optional: Close the connection when done
export async function closeDatabaseConnection() {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}
