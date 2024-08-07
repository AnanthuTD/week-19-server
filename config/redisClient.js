import { createClient } from "redis";
import { $env } from "../env.js";

const client = createClient({
   url: $env.REDIS_URL,
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect().then(() => {
   console.log("Connected to Redis");
});

export { client as redisClient };
