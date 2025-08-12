/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";
import { Context } from "../../../../context";

/*
 * TYPES
 */
interface JWTPayload {
  id: string;
  email: string;
}

/*
 * FUNCTION: Refresh Token Handler for GraphQL
 */
export async function AccountTokenGenerate(
  refreshToken: string,
  ctx: Context
): Promise<{
  accessToken: string;
  refreshToken: string;
  status: string;
  message: string;
}> {
  // Device and IP for more security
  const device = ctx.device || "unknown";
  const ip = ctx.ip;

  // If not present
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // Check if token exists in DB
  const storedToken = await ctx.prisma.refreshToken.findUnique({
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

  const { id, email } = userData;

  // Delete old refresh token
  await ctx.prisma.refreshToken.delete({ where: { token: refreshToken } });

  // Generate new tokens
  const _NewAccessToken = jwt.sign(
    { id, email },
    process.env.JWT_SECRET || "jwt_secret",
    { expiresIn: "5m" }
  );

  const _NewRefreshToken = jwt.sign(
    { id, email },
    process.env.REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );

  // 6️⃣ Save new refresh token
  await ctx.prisma.refreshToken.create({
    data: {
      token: _NewRefreshToken,
      device,
      ip: Array.isArray(ip) ? ip[0] : ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      Account__fk__: id,
    },
  });

  return {
    accessToken: _NewAccessToken,
    refreshToken: _NewRefreshToken,
    status: "TOKEN_GENERATED",
    message: "Token generated successfully",
  };
}
