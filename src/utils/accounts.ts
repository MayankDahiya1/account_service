/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const DB = new PrismaClient();

/*
 * TYPE DEFINITIONS
 */
interface JWTPayload {
  id: string;
  email: string;
  [key: string]: any;
}

/*
 * Ensure required env variables exist
 */
const JWT_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_SECRET and REFRESH_SECRET must be set in environment variables."
  );
}

/*
 * FUNCTION: Generate Access Token
 */
export function _GenerateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "5m" });
}

/*
 * FUNCTION: Generate Refresh Token
 */
export async function _GenerateRefreshToken(
  userId: string,
  payload: JWTPayload,
  device: string,
  ip: string
): Promise<string | undefined> {
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

  const _RefreshToken = await DB.refreshToken.create({
    data: {
      token,
      device,
      ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      Account__fk__: userId,
    },
  });

  if (!_RefreshToken) {
    return undefined;
  }

  return token;
}
