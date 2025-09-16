/*
 * IMPORTS
 */
import bcrypt from "bcryptjs";
import { Context } from "../../../../context";
import {
  _GenerateAccessToken,
  _GenerateRefreshToken,
} from "../../../../utils/accounts";

/*
 * TYPES
 */
interface LoginArgs {
  email: string;
  password: string;
}

/*
 * RESOLVER: Account Login
 */
export async function AccountLogin(
  _parent: unknown,
  args: LoginArgs,
  Context: Context
) {
  // Find account by email
  const _Account = await Context.prisma.account.findUnique({
    where: { email: args.email },
  });

  // If account not found, throw error
  if (_Account instanceof Error || !_Account) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isMatch = await bcrypt.compare(args.password, _Account.password);

  // If password does not match, throw error
  if (!isMatch) throw new Error("Invalid email or password");

  // Create JWT payload
  const _Payload = { id: _Account.id || "", email: _Account.email || "" };

  // Generate tokens
  const _AccessToken = _GenerateAccessToken(_Payload);

  // Generate refresh token and store in DB
  const _RefreshToken = await _GenerateRefreshToken(
    _Account.id,
    _Payload,
    Context.device,
    Context.ip as string
  );

  console.log();

  // Return tokens + account info
  return {
    status: "LOGGED_IN_SUCCESSFULLY",
    message: "User logged in successfully",
    accessToken: _AccessToken,
    refreshToken: _RefreshToken,
    Account: {
      ..._Account,
      name: _Account.fullName,
    },
  };
}
