import app from "./app.js";
import { connectToMongoDB } from "./config/connection.js";
import { $env } from "./env.js";

const startServer = async () => {
   // connecting to mongoDB server
   await connectToMongoDB();

   app.listen($env.PORT, () => {
      console.log(`Example app listening on port ${$env.PORT}`);
   });
};

startServer();
