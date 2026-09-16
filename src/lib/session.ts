import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Ensures the current user is a member of the given company; redirects otherwise. */
export async function requireCompanyAccess(companyId: string) {
  const user = await requireUser();
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (!membership) redirect("/app");
  return { user, membership };
}
