import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";
import { redisClient } from "../config/redisClient.js";
import { objId } from "./mongoHelpers.js";
import key from "../config/key.js";

export async function getAllUsers({ currentUserId }) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .find(
         { _id: { $ne: objId(currentUserId) } },
         { projection: { password: 0 } }
      )
      .toArray({});
}

export async function getUserById(id) {
   const db = getDB();

   return await db.collection(collections.ACCOUNTS).findOne({ _id: objId(id) });
}

export async function deleteUserById(id) {
   const db = getDB();

   try {
      await db
         .collection(collections.ACCOUNTS)
         .findOneAndDelete(
            { _id: objId(id) },
            { projection: { sessionId: 1 } }
         );

      redisClient.del(`${key.REFRESH_TOKEN}:${id}`);
   } catch (error) {
      throw error;
   }
}

export async function updateUserById({ _id, name, role, email }) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .updateOne({ _id: objId(_id) }, { $set: { name, role, email } });
}

export async function searchUserById(_id) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .findOne({ _id: objId(_id) });
}

export async function searchUsers({ col, query }) {
   const db = getDB();
   const pattern = new RegExp(query);

   if (col === "firstName" || col === "lastName") {
      col = "name." + col;
   }

   return await db
      .collection(collections.ACCOUNTS)
      .find(
         {
            [col]: {
               $regex: pattern,
            },
         },
         { projection: { password: 0 } }
      )
      .toArray({});
}
