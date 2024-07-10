import bcrypt from "bcryptjs";
import { getDB } from "../config/connection.js";
import collections from "../config/collections.js";
import { objId } from "./mongoHelpers.js";

export function hashPassword({ password }) {
   return bcrypt.hashSync(password);
}

export function comparePassword({ password, hash }) {
   return bcrypt.compareSync(password, hash);
}

export async function createOrUpsertUserGoogle(user) {
   const db = getDB();

   const existingUser = await db
      .collection(collections.ACCOUNTS)
      .findOne({ email: user.email });

   if (existingUser && existingUser.avatar) {
      delete user.avatar;
   }

   return await db.collection(collections.ACCOUNTS).findOneAndUpdate(
      { email: user.email },
      { $set: user },
      {
         upsert: true,
         returnDocument: "after",
         projection: { password: 0 },
      }
   );
}

export async function linkSessionAndUser({ sessionId, accountId }) {
   const db = getDB();
   return await db
      .collection(collections.ACCOUNTS)
      .updateOne(
         { _id: objId(accountId) },
         { $push: { sessionId: sessionId } }
      );
}

export function validateEmail(email) {
   const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
   return emailPattern.test(email);
}

export function validatePassword(pass) {
   const passwordPattern =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
   return passwordPattern.test(pass);
}
