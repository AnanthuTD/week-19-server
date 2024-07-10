import multer from "multer";
import { emptydirSync } from "fs-extra";
import path from "path";

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const userDir = path.join("public/avatar/", req.user._id);

      // empty the director , if not exists then create
      emptydirSync(userDir);

      cb(null, userDir);
   },
   filename: (req, file, cb) => {
      const fileFormat = String(file.originalname).split(".").at(-1);
      cb(null, `${req.user._id}.${fileFormat}`);
   },
});

export const uploadAvatar = multer({ storage });
