"use strict";
import express from "express";
import {
   deleteUserById,
   getAllUsers,
   getUserById,
   searchUsers,
   updateUserById,
} from "../helpers/adminHelpers.js";
import { updateProfile } from "../helpers/commonHelpers.js";
const router = express.Router();

router.get("/user", async (req, res) => {
   try {
      const users = await getAllUsers({ currentUserId: req.user._id });
      res.json({ users, error: false });
   } catch (error) {
      res.status(500).json({
         error: false,
         msg: error.message || "Something went wrong!",
      });
   }
});

router.patch("/user", async (req, res) => {
   const { user } = req.body;
   if (!(user && user._id))
      return res
         .status(400)
         .json({ error: true, msg: "User _id not provided" });

   try {
      const { name, _id, email, role } = user;
      const updatedUsr = await updateUserById({ name, _id, email, role });
      let message = "Successfully updated";
      if (updatedUsr.matchedCount) {
         message = "User updated successfully";
      } else if (updatedUsr.modifiedCount) {
         message = "Nothing to update!";
      } else if (!updatedUsr.matchedCount) {
         message = "No matches found!";
      }

      res.json({ error: false, msg: message, count: updatedUsr.modifiedCount });
   } catch (error) {
      res.status(500).json({
         error: true,
         msg: error.message || "Something went wrong!",
      });
   }
});

router.get("/user/search", async (req, res) => {
   const { col, query } = req.query;
   if (!(col && query))
      return res
         .status(400)
         .json({ error: true, msg: "Provide a search query" });

   if (!["_id", "firstName", "lastName", "email", "role"].includes(col))
      return res
         .status(400)
         .json({ error: true, msg: "Invalid search column" });

   try {
      const users = [];
      if (col === "_id") {
         users.push(await getUserById(query));
      } else {
         users.push(await searchUsers({ col, query }));
      }
      res.json({ users, error: false });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         error: true,
         msg: error.message || "Something went wrong!",
      });
   }
});

router.delete("/user/:id", async (req, res) => {
   const { id } = req.params;
   if (!id)
      return res.status(400).json({ error: true, msg: "Provide a user ID" });

   const User = await getUserById(id);
   if (!User)
      return res.status(400).json({ error: true, msg: "Invalid user ID" });

   if (User?.role === "admin")
      return res.status(403).json({
         error: true,
         msg: "You do not have permission to delete another admin",
      });
   try {
      await deleteUserById(id);
      res.json({ error: false, msg: "User deleted successfully" });
   } catch (error) {
      res.status(500).json({
         error: true,
         msg: error.message || "Something went wrong!",
      });
      console.error(error);
   }
});

router.put("/profile", async (req, res) => {
   const profile = req.body;
   const user = req.user;
   try {
      const updatedUser = await updateProfile({ profile, _id: user._id });
      req.user = updatedUser;
      res.json({
         error: false,
         msg: "Profile updated successfully",
         profile: updatedUser,
      });
   } catch (error) {
      res.status(500).json({ error: true, msg: error.message });
      console.error(error);
   }
});

export default router;
