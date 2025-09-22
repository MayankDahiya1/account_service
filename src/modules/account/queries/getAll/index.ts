/*
 * IMPORTS
 */
import { prisma } from "../../../../prisma/client";
import { Prisma } from "@prisma/client";

/*
 * TYPES
 */
interface GetAllArgs {
  limit?: number;
  search?: string;
}

/*
 * RESOLVER: Account Get All
 */
export async function AccountGetAll(_parent: unknown, args: GetAllArgs) {
  const { limit, search } = args;

  const _WhereClause: Prisma.AccountWhereInput = search
    ? {
        OR: [
          {
            email: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }
    : {};

  return await prisma.account.findMany({
    where: _WhereClause,
    take: limit || undefined,
    orderBy: { createdAt: "desc" },
  });
}
