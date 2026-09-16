import { Crown, TrendingUp, Megaphone, Headphones, Search, BarChart3, Code2, Cog } from "lucide-react";

export const EMPLOYEE_KIND_ICON = {
  ceo: Crown,
  sales: TrendingUp,
  marketing: Megaphone,
  support: Headphones,
  research: Search,
  analyst: BarChart3,
  developer: Code2,
  operations: Cog,
} as const;

export type EmployeeKind = keyof typeof EMPLOYEE_KIND_ICON;

export const EMPLOYEE_KIND_LABEL: Record<EmployeeKind, string> = {
  ceo: "CEO",
  sales: "Sales",
  marketing: "Marketing",
  support: "Support",
  research: "Research",
  analyst: "Analyst",
  developer: "Developer",
  operations: "Operations",
};
