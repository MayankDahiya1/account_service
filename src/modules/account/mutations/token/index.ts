/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";
import { Context } from "../../../../context";

/*
 * TYPES
 */
interface JWTPayload {
  refreshToken: string;
  email?: string;
  id?: string;
}

/*
 * RESOLVER: Account Token Generate
 */
export async function AccountTokenGenerate(
  _parent: unknown,
  args: JWTPayload,
  Context: Context
): Promise<{
  accessToken: string;
  refreshToken: string;
  status: string;
  message: string;
}> {
  // Device and IP for more security
  const device = Context.device || "unknown";
  const ip = Context.ip;
  let refreshToken = args.refreshToken;

  // If not present
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // Check if token exists in DB
  const storedToken = await Context.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  // Verify device & IP match
  if (storedToken.device !== device || storedToken.ip !== ip) {
    throw new Error("Token used from different device/IP");
  }

  // Verify token validity
  let userData: JWTPayload;
  try {
    userData = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET || "refresh_secret"
    ) as JWTPayload;
  } catch {
    throw new Error("Refresh token expired");
  }

  console.log(userData, "refreshed");

  const { id, email } = userData;

  // Delete old refresh token
  const _Delete = await Context.prisma.refreshToken.delete({
    where: { token: refreshToken },
  });

  console.log(_Delete, "deleted");

  // If deletion fails
  if (_Delete instanceof Error) {
    throw new Error("Failed to delete old refresh token");
  }

  // Generate new tokens
  const _NewAccessToken = jwt.sign(
    { id, email },
    process.env.JWT_SECRET || "jwt_secret",
    { expiresIn: "1h" }
  );

  const _NewRefreshToken = jwt.sign(
    { id, email },
    process.env.REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );

  // Save new refresh token
  const _RefreshToken = await Context.prisma.refreshToken.create({
    data: {
      token: _NewRefreshToken,
      device,
      ip: Array.isArray(ip) ? ip[0] : ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      Account__fk__: id || "",
    },
  });

  console.log(_RefreshToken, "stored");

  if (_RefreshToken instanceof Error) {
    throw new Error("Failed to store new refresh token");
  }

  return {
    accessToken: _NewAccessToken,
    refreshToken: _NewRefreshToken,
    status: "TOKEN_GENERATED",
    message: "Token generated successfully",
  };
}
