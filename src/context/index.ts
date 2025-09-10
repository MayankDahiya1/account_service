/*
 * IMPORT
 */
import { Request } from "express";
import { PrismaClient } from "@prisma/client";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import jwt, {
  JwtPayload,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import debug from "debug";

/*
 * DEBUG LOGGING
 */
const log = {
  context: debug("app:context"),
  db: debug("app:db"),
};

/*
 * PRISMA CLIENT
 */
export const prisma = new PrismaClient();

/*
 * REDIS CONFIG & PUBSUB
 */
const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  retryStrategy: () => null,
};

export const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

/*
 * JWT TYPES
 */
export interface JwtUserPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

/*
 * TOKEN VERIFICATION
 */
const verifyToken = (token?: string): JwtUserPayload | null => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtUserPayload;
    log.context("Token verified", decoded.id);
    return decoded;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      log.context("Token expired");
    } else if (err instanceof JsonWebTokenError) {
      log.context("Invalid token");
    } else {
      log.context("Token verification failed", err);
    }
    return null;
  }
};

/*
 * CONTEXT INTERFACE
 */
export interface Context {
  prisma: PrismaClient;
  pubsub: RedisPubSub;
  user: JwtUserPayload | null;
  ip: string;
  device: string;
}

/*
 * CREATE CONTEXT FUNCTION
 */
export const createContext = ({ req }: { req: Request }): Context => {
  log.context("Creating context for request");

  // IP extraction
  const ipHeader = req.headers["x-forwarded-for"] as string | undefined;
  const ip = ipHeader?.split(",")[0] || req.socket.remoteAddress || "unknown";

  // Token extraction from Authorization header
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : undefined;

  return {
    prisma,
    pubsub,
    user: verifyToken(token),
    ip,
    device: req.headers["user-agent"] || "unknown",
  };
};

/*
 * GRACEFUL SHUTDOWN
 */
export const shutdownContext = async () => {
  log.db("Disconnecting Prisma...");
  await prisma.$disconnect();
  log.db("Shutting down Redis...");
  await (pubsub as any).publisher.quit();
  await (pubsub as any).subscriber.quit();
};
