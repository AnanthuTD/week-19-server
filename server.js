import app from "./app";

const startServer = async () => {
   // connecting to mongoDB server
   await connectToMongoDB();

   app.listen($env.PORT, () => {
      console.log(`Example app listening on port ${$env.PORT}`);
   });
};

startServer();
