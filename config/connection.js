import { MongoClient } from "mongodb";

const status = {
   db: null,
};

let connectionCount = 0;
const maxRetries = 3;

export async function connectToMongoDB() {
   const URI = process.env.DB_URI;
   const DBNAME = process.env.DB_NAME;

   while (connectionCount < maxRetries) {
      try {
         const client = await MongoClient.connect(URI);
         status.db = client.db(DBNAME);
         console.log("Connected to MongoDB successfully.");
         return status.db;
      } catch (error) {
         connectionCount++;
         console.warn(`Re-connecting attempt ${connectionCount}...`);
         if (connectionCount >= maxRetries) {
            console.error(
               "\x1b[41m%s\x1b[0m",
               "Connection to MongoDB (local) failed!",
               error
            );
            throw error;
         }
      }
   }
}

export function getDB() {
   return status.db;
}
