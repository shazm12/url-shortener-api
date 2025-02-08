import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const MONGO_DB_CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const MONGO_URI = process.env.MONGO_URI;

// Function to attempt reconnection
const reconnect = () => {
  setTimeout(async () => {
    try {
      await mongoose.connect(MONGO_URI, MONGO_DB_CONFIG);
      console.log("Reconnected to MongoDB!");
    } catch (err) {
      console.error("Failed to reconnect to MongoDB:", err);
      reconnect(); // Retry connection
    }
  }, 5000); // Retry after 5 seconds
};

const connectDB = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in the environment variables.");
    process.exit(1);
  }

  // Auto reconnection to DB logic
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully!");
  });

  mongoose.connection.on("error", (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
    reconnect();
  });

  try {
    await mongoose.connect(MONGO_URI, MONGO_DB_CONFIG);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    reconnect();
  }
};

export default connectDB;
