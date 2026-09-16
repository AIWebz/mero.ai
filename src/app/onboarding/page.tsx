import { requireUser } from "@/lib/session";
import { OnboardingFlow } from "./onboarding-flow";

export default async function OnboardingPage() {
  await requireUser();
  return <OnboardingFlow />;
}
