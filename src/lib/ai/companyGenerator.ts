import { getAIProvider, extractJSON, AINotConnectedError } from "./provider";

export type GenerationSource = "ai" | "template";

export interface CompanyProposal {
  name: string;
  description: string;
  industry: string;
  businessModel: string;
  targetCustomer: string;
  products: string[];
  pricingStrategy: string;
  brandPersonality: string[];
  brandTone: string;
  brandVoice: string;
  brandColors: string[];
  suggestedDomain: string;
  goals: string[];
}

export interface EmployeePlan {
  name: string;
  role: string;
  kind: "ceo" | "sales" | "marketing" | "support" | "research" | "analyst" | "developer" | "operations";
  goal: string;
  schedule: string;
  permissions: Record<string, boolean>;
  tools: string[];
}

export interface WebsiteSection {
  kind: "hero" | "features" | "about" | "products" | "contact_form" | "cta" | "text";
  heading: string;
  body: string;
  items?: string[];
}

export interface WebsitePagePlan {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  sections: WebsiteSection[];
}

export interface KnowledgeDocPlan {
  title: string;
  category: "business_plan" | "marketing" | "sales" | "support" | "general";
  content: string;
}

function titleCaseFromIdea(idea: string): string {
  const words = idea
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "that", "want", "create", "build"].includes(w.toLowerCase()));
  const picked = words.slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return picked.length ? picked.join(" ") : "New Venture";
}

function slugifyDomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".com";
}

function templateProposal(idea: string): CompanyProposal {
  const name = titleCaseFromIdea(idea);
  return {
    name,
    description: idea.trim(),
    industry: "General",
    businessModel: "Ecommerce",
    targetCustomer: "People interested in this product or service",
    products: ["Core offering based on your idea"],
    pricingStrategy: "To be defined — connect an AI provider for a tailored pricing strategy",
    brandPersonality: ["modern", "trustworthy", "approachable"],
    brandTone: "clear and confident",
    brandVoice: "Direct, warm, and helpful",
    brandColors: ["#14151A", "#1D4ED8", "#FAF9F7"],
    suggestedDomain: slugifyDomain(name),
    goals: ["Launch the company", "Get the first 10 customers", "Establish a repeatable marketing channel"],
  };
}

export async function generateCompanyProposal(
  idea: string,
): Promise<{ proposal: CompanyProposal; source: GenerationSource }> {
  const provider = getAIProvider();
  if (!provider.isConnected) {
    return { proposal: templateProposal(idea), source: "template" };
  }

  const prompt = `A user wants to start a company. Their idea:\n"""${idea}"""\n\nPropose a complete business plan as strict JSON with this exact shape (no commentary, no markdown fences):\n{\n  "name": string,\n  "description": string (2-3 sentences),\n  "industry": string,\n  "businessModel": string,\n  "targetCustomer": string,\n  "products": string[] (3-6 items),\n  "pricingStrategy": string,\n  "brandPersonality": string[] (3-5 adjectives),\n  "brandTone": string,\n  "brandVoice": string (one sentence describing how the brand writes/talks),\n  "brandColors": string[] (3 hex colors that fit the brand, first should be a dark ink color, second an accent, third a light background),\n  "suggestedDomain": string (a plausible .com domain),\n  "goals": string[] (3-5 concrete early goals)\n}`;

  try {
    const text = await provider.complete({
      system:
        "You are Mero's business design engine. You turn a one-line idea into a grounded, specific, realistic business plan. Respond with strict JSON only.",
      prompt,
      maxTokens: 1500,
    });
    const proposal = extractJSON<CompanyProposal>(text);
    return { proposal, source: "ai" };
  } catch (err) {
    if (err instanceof AINotConnectedError) return { proposal: templateProposal(idea), source: "template" };
    throw err;
  }
}

const DEFAULT_PERMISSIONS = {
  read_analytics: true,
  create_content: false,
  publish_content: false,
  spend_money: false,
  send_email: false,
};

function templateWorkforce(proposal: CompanyProposal): EmployeePlan[] {
  const employees: EmployeePlan[] = [
    {
      name: "CEO",
      role: "AI CEO",
      kind: "ceo",
      goal: `Coordinate the company toward: ${proposal.goals[0] ?? "growth"}`,
      schedule: "Continuous",
      permissions: { ...DEFAULT_PERMISSIONS, read_analytics: true },
      tools: ["company_memory", "task_router"],
    },
  ];

  const model = proposal.businessModel.toLowerCase();
  const isSaas = /saas|software|app|platform|subscription/.test(model);
  const isService = /service|agency|consult/.test(model);

  employees.push({
    name: "Marketing",
    role: "AI Marketing Manager",
    kind: "marketing",
    goal: "Increase qualified customer acquisition",
    schedule: "Daily",
    permissions: { ...DEFAULT_PERMISSIONS, create_content: true },
    tools: ["website", "analytics"],
  });

  employees.push({
    name: "Sales",
    role: "AI Sales Lead",
    kind: "sales",
    goal: "Convert leads into customers",
    schedule: "Daily",
    permissions: { ...DEFAULT_PERMISSIONS, create_content: true },
    tools: ["crm", "email"],
  });

  employees.push({
    name: "Support",
    role: "AI Support Specialist",
    kind: "support",
    goal: "Resolve customer questions quickly and accurately",
    schedule: "Continuous",
    permissions: { ...DEFAULT_PERMISSIONS },
    tools: ["email", "knowledge_base"],
  });

  if (isSaas) {
    employees.push({
      name: "Developer",
      role: "AI Developer",
      kind: "developer",
      goal: "Maintain and improve the product and website",
      schedule: "Daily",
      permissions: { ...DEFAULT_PERMISSIONS },
      tools: ["website", "database"],
    });
    employees.push({
      name: "Analyst",
      role: "AI Analyst",
      kind: "analyst",
      goal: "Analyze usage and performance to find growth opportunities",
      schedule: "Weekly",
      permissions: { ...DEFAULT_PERMISSIONS },
      tools: ["analytics"],
    });
  } else {
    employees.push({
      name: "Research",
      role: "AI Research Analyst",
      kind: "research",
      goal: "Research customers, competitors, and market opportunities",
      schedule: "Weekly",
      permissions: { ...DEFAULT_PERMISSIONS },
      tools: ["browser"],
    });
    employees.push({
      name: "Analyst",
      role: "AI Analyst",
      kind: "analyst",
      goal: "Analyze company performance and detect opportunities",
      schedule: "Weekly",
      permissions: { ...DEFAULT_PERMISSIONS },
      tools: ["analytics"],
    });
    if (!isService) {
      employees.push({
        name: "Operations",
        role: "AI Operations Manager",
        kind: "operations",
        goal: "Handle recurring operational work",
        schedule: "Daily",
        permissions: { ...DEFAULT_PERMISSIONS },
        tools: ["database", "email"],
      });
    }
  }

  return employees;
}

export async function designWorkforce(
  proposal: CompanyProposal,
): Promise<{ employees: EmployeePlan[]; source: GenerationSource }> {
  const provider = getAIProvider();
  if (!provider.isConnected) {
    return { employees: templateWorkforce(proposal), source: "template" };
  }

  const prompt = `Company:\n${JSON.stringify(proposal, null, 2)}\n\nDesign the AI workforce for this company. Always include exactly one "ceo" kind employee. Choose only roles that make sense for this specific business — do not include every possible role. Valid kinds: ceo, sales, marketing, support, research, analyst, developer, operations.\n\nRespond with strict JSON only, an array of:\n{\n  "name": string (short department name, e.g. "Marketing"),\n  "role": string (e.g. "AI Marketing Manager"),\n  "kind": one of the valid kinds,\n  "goal": string,\n  "schedule": string (human readable cadence),\n  "permissions": { "read_analytics": boolean, "create_content": boolean, "publish_content": boolean, "spend_money": boolean, "send_email": boolean },\n  "tools": string[] (tool ids like "website", "analytics", "crm", "email", "browser", "database")\n}`;

  try {
    const text = await provider.complete({
      system: "You are Mero's org-design engine. You decide which AI employees a company actually needs, never more.",
      prompt,
      maxTokens: 2000,
    });
    const employees = extractJSON<EmployeePlan[]>(text);
    return { employees, source: "ai" };
  } catch (err) {
    if (err instanceof AINotConnectedError) return { employees: templateWorkforce(proposal), source: "template" };
    throw err;
  }
}

function templateWebsite(proposal: CompanyProposal): WebsitePagePlan[] {
  return [
    {
      slug: "/",
      title: "Home",
      seoTitle: `${proposal.name} — ${proposal.industry}`,
      seoDescription: proposal.description,
      sections: [
        { kind: "hero", heading: proposal.name, body: proposal.description },
        {
          kind: "features",
          heading: "What we offer",
          body: "",
          items: proposal.products,
        },
        { kind: "cta", heading: "Ready to get started?", body: `Join ${proposal.name} today.` },
      ],
    },
    {
      slug: "/about",
      title: "About",
      seoTitle: `About ${proposal.name}`,
      seoDescription: `Learn about ${proposal.name} and who we serve.`,
      sections: [
        { kind: "about", heading: `About ${proposal.name}`, body: proposal.description },
        { kind: "text", heading: "Who we serve", body: proposal.targetCustomer },
      ],
    },
    {
      slug: "/contact",
      title: "Contact",
      seoTitle: `Contact ${proposal.name}`,
      seoDescription: `Get in touch with ${proposal.name}.`,
      sections: [
        { kind: "contact_form", heading: "Get in touch", body: "We'd love to hear from you." },
      ],
    },
  ];
}

export async function generateWebsite(
  proposal: CompanyProposal,
): Promise<{ pages: WebsitePagePlan[]; source: GenerationSource }> {
  const provider = getAIProvider();
  if (!provider.isConnected) {
    return { pages: templateWebsite(proposal), source: "template" };
  }

  const prompt = `Company:\n${JSON.stringify(proposal, null, 2)}\n\nWrite the initial marketing website for this company: a home page, an about page, and a contact page. Copy should be specific to this business, not generic. Respond with strict JSON only, an array of pages:\n{\n  "slug": "/" | "/about" | "/contact",\n  "title": string,\n  "seoTitle": string,\n  "seoDescription": string,\n  "sections": [ { "kind": "hero"|"features"|"about"|"products"|"contact_form"|"cta"|"text", "heading": string, "body": string, "items"?: string[] } ]\n}`;

  try {
    const text = await provider.complete({
      system: "You are Mero's website copywriting engine. Write premium, specific, non-generic marketing copy.",
      prompt,
      maxTokens: 3000,
    });
    const pages = extractJSON<WebsitePagePlan[]>(text);
    return { pages, source: "ai" };
  } catch (err) {
    if (err instanceof AINotConnectedError) return { pages: templateWebsite(proposal), source: "template" };
    throw err;
  }
}

function templateKnowledge(proposal: CompanyProposal): KnowledgeDocPlan[] {
  return [
    {
      title: "Business Overview",
      category: "business_plan",
      content: `${proposal.name}\n\n${proposal.description}\n\nIndustry: ${proposal.industry}\nBusiness model: ${proposal.businessModel}\nTarget customer: ${proposal.targetCustomer}\nPricing strategy: ${proposal.pricingStrategy}`,
    },
    {
      title: "Products & Services",
      category: "sales",
      content: proposal.products.map((p) => `- ${p}`).join("\n"),
    },
    {
      title: "Brand Voice",
      category: "marketing",
      content: `Tone: ${proposal.brandTone}\nVoice: ${proposal.brandVoice}\nPersonality: ${proposal.brandPersonality.join(", ")}`,
    },
  ];
}

export async function generateKnowledgeBase(
  proposal: CompanyProposal,
): Promise<{ docs: KnowledgeDocPlan[]; source: GenerationSource }> {
  const provider = getAIProvider();
  if (!provider.isConnected) {
    return { docs: templateKnowledge(proposal), source: "template" };
  }

  const prompt = `Company:\n${JSON.stringify(proposal, null, 2)}\n\nWrite the company's starting knowledge base: a business overview, a customer support FAQ/policy doc, and an initial marketing plan. Respond with strict JSON only, an array of:\n{ "title": string, "category": "business_plan"|"marketing"|"sales"|"support"|"general", "content": string (markdown, specific to this business) }`;

  try {
    const text = await provider.complete({
      system: "You are Mero's knowledge base engine. Write grounded, specific internal documentation, not generic filler.",
      prompt,
      maxTokens: 3000,
    });
    const docs = extractJSON<KnowledgeDocPlan[]>(text);
    return { docs, source: "ai" };
  } catch (err) {
    if (err instanceof AINotConnectedError) return { docs: templateKnowledge(proposal), source: "template" };
    throw err;
  }
}
