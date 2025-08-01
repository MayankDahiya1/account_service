import { prisma } from '../../../../prisma/client';

export async function AccountGetById(_: any, args: { id: string }) {
  return prisma.account.findUnique({ where: { id: args.id } });
}
