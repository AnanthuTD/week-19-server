import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { connectToMongoDB } from "./config/connection.js";
import { requireAdmin, requireLogin } from "./middleware/authMiddleware.js";
import cors from "cors";
import { $env } from "./env.js";

const app = express();

app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
   console.log("Incoming request: " + req.method + " " + req.url);
   res.on("finish", () => {
      console.log("Outgoing response: " + res.statusCode);
   });
   next();
});

app.get("/", (req, res) => {
   res.send("Hello World!");
});
app.use("/auth", authRoutes);
app.use("/user", requireLogin, userRoutes);
app.use("/admin", requireLogin, requireAdmin, adminRoutes);

export default app
