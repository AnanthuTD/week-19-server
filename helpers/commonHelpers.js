import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";
import { hashPassword } from "./authHelpers.js";
import { objId } from "./mongoHelpers.js";

export async function updateProfile({ profile, _id }) {
   const db = getDB();

   const cleanedProfile = {
      name: {
         firstName: profile.firstName,
         lastName: profile.lastName,
      },
      email: profile.email,
      password: hashPassword({ password: profile.password }),
   };

   return await db
      .collection(collections.ACCOUNTS)
      .findOneAndUpdate(
         { _id: objId(_id) },
         { $set: { ...cleanedProfile } },
         { returnDocument: "after", projection: { password: 0, sessionId: 0 } }
      );
}
