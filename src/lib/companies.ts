import { prisma } from "@/lib/prisma";

export async function getUserCompanies(userId: string) {
  const memberships = await prisma.companyMember.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
  return memberships.map((m) => m.company);
}
