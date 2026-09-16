import Anthropic from "@anthropic-ai/sdk";

/**
 * Provider abstraction so the rest of the app never talks to a specific vendor SDK directly.
 * Swapping models/providers means implementing this interface, not rewriting call sites.
 */
export interface AIProvider {
  readonly name: string;
  readonly isConnected: boolean;
  complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string>;
}

export class AINotConnectedError extends Error {
  constructor() {
    super("No AI provider is connected. Add ANTHROPIC_API_KEY to enable AI generation.");
    this.name = "AINotConnectedError";
  }
}

class AnthropicProvider implements AIProvider {
  readonly name = "Anthropic";
  private client: Anthropic | null;

  constructor(apiKey: string | undefined) {
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  get isConnected() {
    return this.client !== null;
  }

  async complete({ system, prompt, maxTokens = 2048 }: { system?: string; prompt: string; maxTokens?: number }) {
    if (!this.client) throw new AINotConnectedError();
    const response = await this.client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    cachedProvider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  }
  return cachedProvider;
}

/** Extracts the first top-level JSON object/array from a model response, tolerating prose or code fences. */
export function extractJSON<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in AI response");
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
