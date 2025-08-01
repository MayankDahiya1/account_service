/*
 * IMPORTS
 */
import { prisma } from "../../../../prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface CreateAccountArgs {
  email: string;
  password: string;
  name: string;
  phone: string;
  profilePicture?: string;
}

// Fallback JWT secret in case env is missing (not recommended for prod)
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";

/*
  EXPORTS
 */
export async function AccountCreate(args: CreateAccountArgs) {
  // Check if an account with the same email already exists
  const existing = await prisma.account.findUnique({
    where: { email: args.email },
  });

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  // Hash the user's password
  const hashedPassword = await bcrypt.hash(args.password, 10);

  // Store the new user in the database
  const account = await prisma.account.create({
    data: {
      email: args.email,
      password: hashedPassword,
      name: args.name,
      phone: args.phone,
      profilePicture: args.profilePicture,
      role: "OWNER", // You can later make this dynamic if needed
    },
  });

  // Generate a JWT token for the new user
  const token = jwt.sign({ userId: account.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Return the token and user data (excluding password)
  return {
    token,
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      profilePicture: account.profilePicture,
      role: account.role,
    },
  };
}
