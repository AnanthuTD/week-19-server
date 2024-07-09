import express from "express";
import { updateProfile } from "../helpers/commonHelpers.js";
const router = express.Router();

router.put("/profile", async (req, res) => {
   const profile = req.body;
   const user = req.session.user;
   try {
      const updatedUser = await updateProfile({ profile, _id: user._id });
      req.session.user = updatedUser;
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
