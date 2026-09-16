import { requireCompanyAccess } from "@/lib/session";
import { BuildProgress } from "./build-progress";

export default async function BuildingPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);
  return <BuildProgress companyId={companyId} />;
}
