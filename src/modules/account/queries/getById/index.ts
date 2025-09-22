/*
 * IMPORTS
 */
import { prisma } from "../../../../prisma/client";

/*
 * TYPES
 */
interface GetByIdArgs {
  id: string;
}

/*
 * RESOLVER: Account Get By ID
 */
export async function AccountGetById(_parent: unknown, args: GetByIdArgs) {
  return prisma.account.findUnique({ where: { id: args.id } });
}
