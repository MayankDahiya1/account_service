import { prisma } from "../../../../prisma/client";
import { Prisma } from "@prisma/client"; // 👈 ye import add karo

export async function AccountGetAll(
  _: any,
  args: { limit?: number; search?: string }
) {
  const { limit, search } = args;

  const whereClause: Prisma.AccountWhereInput = search
    ? {
        OR: [
          {
            email: {
              contains: search,
              mode: Prisma.QueryMode.insensitive, // 👈 yahan enum use karo
            },
          },
        ],
      }
    : {};

  return await prisma.account.findMany({
    where: whereClause,
    take: limit || undefined,
    orderBy: { createdAt: "desc" },
  });
}
