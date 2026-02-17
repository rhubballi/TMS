import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/tms";
  try {
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log("Connected to MongoDB");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", err);
    // Do not exit the process; allow server to start for development/testing.
    // Controllers will return errors for operations that require the DB.
  }
};
