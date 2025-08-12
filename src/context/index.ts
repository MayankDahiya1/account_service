/*
 * CONTEXT SETUP
 */
import { Request } from "express";
import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import jwt from "jsonwebtoken";
import debug from "debug";

/*
 * DEBUG LOGGING
 */
const log = {
  context: debug("app:context"),
  db: debug("app:db"),
};

/*
 * PRISMA & PUBSUB INIT
 */
const prisma = new PrismaClient();
const pubsub = new PubSub();

/*
 * TOKEN VERIFICATION
 */
const verifyToken = (authHeader?: string) => {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    log.context("✅ Token verified");
    return decoded;
  } catch (err) {
    log.context("Invalid token");
    return null;
  }
};

/*
 * TYPE: Context
 */
export interface Context {
  prisma: PrismaClient;
  pubsub: PubSub;
  user: any;
  ip: string | string[];
  device: string;
}

/*
 * CREATE CONTEXT FUNCTION
 */
export const createContext = ({ req }: { req: Request }): Context => {
  log.context("Creating context for request");

  // IP access
  const ipHeader = req.headers["x-forwarded-for"] as any;
  const ip = ipHeader || req.ip;

  // Return
  return {
    prisma,
    pubsub,
    user: verifyToken(req.headers.authorization),
    ip,
    device: req.headers["user-agent"] || "unknown",
  };
};
