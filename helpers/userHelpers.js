import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";
import { $env } from "../env.js";
import { objId } from "./mongoHelpers.js";
import jwt from "jsonwebtoken";

export async function createUser(user) {
   const db = getDB();
   return await db.collection(collections.ACCOUNTS).insertOne(user);
}

export async function getUserByEmail(email) {
   const db = getDB();
   return await db.collection(collections.ACCOUNTS).findOne({ email });
}

export function updateAvatar({ _id, avatar }) {
   const db = getDB();
   db.collection(collections.ACCOUNTS)
      .updateOne({ _id: objId(_id) }, { $set: { avatar } })
}

export function updateRefreshToken(refreshToken, newTokenPartials) {
   const decodedToken = jwt.verify(refreshToken, $env.REFRESH_TOKEN_SECRET);
   const newToken = { ...decodedToken, ...newTokenPartials };
   delete newToken.exp;
   return jwt.sign(newToken, $env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${$env.REFRESH_TOKEN_EXP}d`,
   });
}
