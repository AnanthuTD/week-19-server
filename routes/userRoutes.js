import express from "express";
import path from "path";
import { updateProfile } from "../helpers/commonHelpers.js";
import { uploadAvatar } from "../middleware/fileUploadMiddleware.js";
import { $env } from "../env.js";
import { updateAvatar, updateRefreshToken } from "../helpers/userHelpers.js";
import { getRefreshTokenExp } from "../helpers/tokenHelpers.js";
import key from "../config/key.js";
const router = express.Router();

router.get("/", (req, res) => {
   console.log("req.user", req.user);
   res.json({ user: req.user });
});

router.post("/upload/avatar", uploadAvatar.single("avatar"), (req, res) => {
   try {
      const fileUrl = `${$env.BASE_URL}/avatar/${req.user._id}/${req.file.filename}`;
      
      updateAvatar({ _id: req.user._id, avatar: fileUrl });

      const { refreshToken } = req.cookies;
      const updatedRefreshToken = updateRefreshToken(refreshToken, {
         avatar: fileUrl,
      });

      res.cookie(`${key.REFRESH_TOKEN}`, updatedRefreshToken, {
         httpOnly: true,
         secure: true,
         expires: getRefreshTokenExp(),
         sameSite: "strict",
      });

      res.status(200).json({
         message: "File uploaded successfully",
         avatar: fileUrl,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "File upload failed", error });
   }
});

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
