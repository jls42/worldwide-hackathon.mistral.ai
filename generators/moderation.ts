import { Mistral } from '@mistralai/mistralai';

export interface ModerationResult {
  safe: boolean;
  categories: Record<string, boolean>;
}

export async function moderateContent(
  client: Mistral,
  text: string,
  blockedCategories?: string[],
): Promise<ModerationResult> {
  const response = await (client.classifiers as any).moderate({
    model: 'mistral-moderation-latest',
    inputs: [text.slice(0, 4000)],
  });

  const result = response.results[0];
  const categories = result.categories as Record<string, boolean>;
  const safe =
    blockedCategories && blockedCategories.length > 0
      ? !blockedCategories.some((cat) => categories[cat] === true)
      : !Object.values(categories).some((v) => v === true);

  return { safe, categories };
}
