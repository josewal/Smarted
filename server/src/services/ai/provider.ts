import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAIClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const ai = getAIClient();
  const response = await ai.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt || 'You are a helpful learning assistant.',
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  throw new Error('Unexpected response type from AI');
}
