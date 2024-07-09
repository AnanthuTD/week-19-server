import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";


export async function createUser(user) {
   const db = getDB();
   return await db.collection(collections.ACCOUNTS).insertOne(user)
}

export async function getUserByEmail(email) {
   const db = getDB();
   return await db.collection(collections.ACCOUNTS).findOne({ email });
}