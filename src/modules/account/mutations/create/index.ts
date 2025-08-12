/*
 * IMPORTS
 */

import { Context } from "../../../../context";
import bcrypt from "bcryptjs";

interface CreateAccountArgs {
  email: string;
  password: string;
  name: string;
}

/*
  EXPORTS
 */
export async function AccountCreate(
  _parent: unknown,
  args: CreateAccountArgs,
  Context: Context
) {
  // Check if an account with the same email already exists
  const _Existing = await Context.prisma.account.findUnique({
    where: { email: args.email },
  });

  if (_Existing instanceof Error || _Existing) {
    throw new Error("An account with this email already exists.");
  }

  // Hash the user's password
  const _HashedPassword = await bcrypt.hash(args.password, 10);

  // Store the new user in the database
  const _Account = await Context.prisma.account.create({
    data: {
      email: args.email,
      password: _HashedPassword,
      name: args.name,
      role: "BARBER",
    },
  });

  // Return
  return {
    status: "REGISTERED_SUCCESSFULLY",
    message: "Registered successfully",
    Account: {
      id: _Account.id,
      email: _Account.email,
      name: _Account.name,
      role: _Account.role,
    },
  };
}
