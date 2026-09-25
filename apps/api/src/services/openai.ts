import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const MODEL_OPENAI = 'gpt-4o-mini';
const MODEL_OPENROUTER_FALLBACK = 'openai/gpt-4o-mini';

interface Subscription {
  name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  category: string;
  lastCharged: string | null;
  active: boolean;
}

function isBillingOrQuotaError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.code === 'insufficient_quota' ||
    err?.status === 402 ||
    err?.error?.type === 'insufficient_quota'
  );
}

function buildPrompt(transactionText: string): string {
  return `You are analyzing a bank statement to detect recurring subscription charges.

Here are the transactions:
${transactionText}

Identify all recurring subscription charges (streaming services, software tools, memberships — charges that repeat on a regular cycle). Ignore one-off purchases.

Respond ONLY with a valid JSON array, no markdown, no explanation, no code fences. Each item must have exactly this shape:
[{
  "name": "string",
  "amount": number,
  "currency": "NGN" | "USD",
  "frequency": "monthly" | "quarterly" | "annual",
  "category": "string (e.g. streaming, software, utilities, membership, other)",
  "lastCharged": "YYYY-MM-DD or null",
  "active": boolean
}]

If no subscriptions are found, respond with an empty array: []`;
}

function parseSubscriptions(rawText: string): Subscription[] {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('AI response was not a JSON array');
  }
  return parsed;
}

export async function analyzeTransactions(transactionText: string): Promise<Subscription[]> {
  const prompt = buildPrompt(transactionText);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_OPENAI,
      messages: [{ role: 'user', content: prompt }],
    });
    const rawText = response.choices[0]?.message?.content || '[]';
    return parseSubscriptions(rawText);
  } catch (err: any) {
    if (!isBillingOrQuotaError(err)) {
      throw err;
    }

    console.warn('⚠️ OpenAI billing/quota failure — falling back to OpenRouter');

    try {
      const fallbackResponse = await openrouter.chat.completions.create({
        model: MODEL_OPENROUTER_FALLBACK,
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = fallbackResponse.choices[0]?.message?.content || '[]';
      return parseSubscriptions(rawText);
    } catch (fallbackErr: any) {
      console.error('OpenRouter fallback also failed:', fallbackErr.message);
      throw new Error('AI_ALL_PROVIDERS_FAILED');
    }
  }
}
