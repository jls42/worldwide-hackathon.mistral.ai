import { Mistral } from '@mistralai/mistralai';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { collectStream } from '../helpers/audio.js';
import { imageSystem, imageUser } from '../prompts.js';

export async function generateImage(
  client: Mistral,
  markdown: string,
  projectDir: string,
  pid: string,
  lang: string = 'fr',
  ageGroup: string = 'enfant',
): Promise<{ imageUrl: string; prompt: string }> {
  const agent = await client.beta.agents.create({
    model: 'mistral-large-latest',
    name: 'Illustrator',
    instructions: imageSystem(lang, ageGroup as any),
    tools: [{ type: 'image_generation' } as any],
    completionArgs: { temperature: 0.3, topP: 0.95 },
  });

  try {
    const prompt = imageUser(lang, markdown);

    const response = await client.beta.conversations.start({
      agentId: agent.id,
      inputs: prompt,
    });

    let fileId = '';
    for (const output of response.outputs) {
      const o = output as Record<string, unknown>;
      if (Array.isArray(o.content)) {
        for (const chunk of o.content) {
          const c = chunk as Record<string, unknown>;
          if (c.fileId) {
            fileId = String(c.fileId);
            break;
          }
          if (c.file_id) {
            fileId = String(c.file_id);
            break;
          }
          if (c.imageUrl) {
            return { imageUrl: String(c.imageUrl), prompt };
          }
          if (c.url) {
            return { imageUrl: String(c.url), prompt };
          }
        }
      }
      if (fileId) break;
    }

    if (!fileId) {
      console.error('    Image outputs:', JSON.stringify(response.outputs, null, 2).slice(0, 2000));
      throw new Error("Aucune image generee par l'agent");
    }

    console.log(`    Image fileId: ${fileId}, downloading...`);
    const fileStream = await client.files.download({ fileId });
    const imageBuffer = await collectStream(fileStream as any);

    const imageFilename = `illustration-${Date.now()}.png`;
    writeFileSync(join(projectDir, imageFilename), imageBuffer);
    const imageUrl = `/output/projects/${pid}/${imageFilename}`;
    console.log(`    Image saved: ${imageFilename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);

    return { imageUrl, prompt };
  } finally {
    await client.beta.agents.delete({ agentId: agent.id }).catch(() => {});
  }
}
