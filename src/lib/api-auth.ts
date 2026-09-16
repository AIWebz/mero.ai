import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class ApiAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function apiAuthErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  return null;
}

export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiAuthError(401, "Unauthorized");
  return session.user;
}

export async function requireApiCompanyAccess(companyId: string) {
  const user = await requireApiUser();
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (!membership) throw new ApiAuthError(403, "Forbidden");
  return { user, membership };
}
