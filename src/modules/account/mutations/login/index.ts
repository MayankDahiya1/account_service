/*
 * IMPORTS
 */
import { prisma } from "../../../../prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define expected login input
interface LoginArgs {
  email: string;
  password: string;
}

// JWT
const JWT_SECRET = process.env.JWT_SECRET!;

/*
 * EXPORTS
 */
export async function AccountLogin(args: LoginArgs) {
  // Look up user by email
  const account = await prisma.account.findUnique({
    where: { email: args.email },
  });

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(args.password, account.password);
  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  // Generate JWT token
  const token = jwt.sign({ userId: account.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Return token and basic user info (exclude password)
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
