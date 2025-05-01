import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected=> SUCCESSFULLY`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};