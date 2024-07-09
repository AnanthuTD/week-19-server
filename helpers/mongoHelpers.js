import { ObjectId } from "mongodb";

// convert string id to ObjectId
export function objId(id){
   return new ObjectId(id);
}