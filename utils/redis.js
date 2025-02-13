import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.error("Redis Client Error:", err));

export const connectRedis = async() => {
  try {
    await client.connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.error("Redis connection error:", err);
  }
}

export default client;
