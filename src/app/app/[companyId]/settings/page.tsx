import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { getAIProvider } from "@/lib/ai/provider";
import { SettingsView } from "./settings-view";

export default async function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [settings, members] = await Promise.all([
    prisma.companySettings.findUnique({ where: { companyId } }),
    prisma.companyMember.findMany({ where: { companyId }, include: { user: true } }),
  ]);

  const provider = getAIProvider();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Autonomy, notifications, and who has access.</p>
      </div>
      <SettingsView
        companyId={companyId}
        aiConnected={provider.isConnected}
        aiProviderName={provider.name}
        settings={{
          aiAutonomyLevel: settings?.aiAutonomyLevel ?? "supervised",
          timezone: settings?.timezone ?? "UTC",
          notifyEmail: settings?.notifyEmail ?? "",
        }}
        members={members.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role }))}
      />
    </div>
  );
}
