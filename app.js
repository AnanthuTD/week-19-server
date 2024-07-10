import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { adminAuthMiddleware, userAuthMiddleware } from "./middleware/authMiddleware.js";
import getRootDir from './getRootDir.js'
import path from 'path';

const app = express();

app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

app.use(cookieParser());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
   console.log("Incoming request: " + req.method + " " + req.url);
   res.on("finish", () => {
      console.log("Outgoing response: " + res.statusCode);
   });
   next();
});

const dirname = getRootDir();
app.use(express.static(path.join(dirname, 'public')));

app.get("/", (req, res) => {
   res.send("Hello World!");
});
app.use("/auth", authRoutes);
app.use("/user", userAuthMiddleware, userRoutes);
app.use("/admin", adminAuthMiddleware, adminRoutes);

export default app
