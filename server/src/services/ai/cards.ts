import { generateText } from './provider.js';

interface GeneratedCard {
  front: string;
  back: string;
  card_type: 'basic' | 'cloze';
}

const SYSTEM_PROMPT = `You are a learning assistant that creates flashcards from source material.
Your cards should follow these principles:
- Each card tests ONE atomic concept
- Questions should require active recall, not recognition
- Answers should be concise but complete
- Use cloze deletions when the material has key terms to memorize
- Avoid yes/no questions — ask "what", "how", "why", "compare"
- Cards should be self-contained (understandable without the source)

Respond with a JSON array of cards. Each card has:
- "front": the question or prompt
- "back": the answer or explanation
- "card_type": "basic" or "cloze"

For cloze cards, use {{c1::answer}} syntax in the front field.
Respond ONLY with the JSON array, no other text.`;

export async function generateCardsFromText(
  sourceText: string,
  count = 5
): Promise<GeneratedCard[]> {
  const prompt = `Generate ${count} flashcards from the following source material:\n\n${sourceText}`;

  const response = await generateText(prompt, SYSTEM_PROMPT);

  // Parse the JSON response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON');
  }

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0]);
  return cards;
}
