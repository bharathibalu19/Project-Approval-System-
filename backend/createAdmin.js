import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin",
    department: "ADMIN"
  });

  console.log("Admin created:", admin);
  process.exit();
}

createAdmin();
