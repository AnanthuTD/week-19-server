import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";
import { objId } from "./mongoHelpers.js";

export async function getAllUsers({ currentUserId }) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .find({ _id: { $ne: objId(currentUserId) } }, { projection: { password: 0 } })
      .toArray({});
}

export async function getUserById(id) {
   const db = getDB();

   return await db.collection(collections.ACCOUNTS).findOne({ _id: objId(id) });
}

export function destroySessions(sessionIds = []) {
   if (!sessionIds.length) return;
   const db = getDB();
   db.collection(collections.SESSION).deleteMany({ _id: { $in: sessionIds } });
}

export async function deleteUserById(id) {
   const db = getDB();

   try {
      const user = await db
         .collection(collections.ACCOUNTS)
         .findOneAndDelete(
            { _id: objId(id) },
            { projection: { sessionId: 1 } }
         );
      if (
         user?.sessionId &&
         Array.isArray(user.sessionId) &&
         user.sessionId.length
      )
         destroySessions(user.sessionId);
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
