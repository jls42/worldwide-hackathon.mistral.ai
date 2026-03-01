import { describe, it, expect } from 'vitest';
import { collectStream } from './audio.js';

describe('collectStream', () => {
  it('AsyncIterable de chunks retourne Buffer concatene', async () => {
    async function* gen() {
      yield Buffer.from('Hello ');
      yield Buffer.from('World');
    }
    const result = await collectStream(gen());
    expect(result.toString()).toBe('Hello World');
  });

  it('ReadableStream retourne Buffer', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('abc'));
        controller.enqueue(new TextEncoder().encode('def'));
        controller.close();
      },
    });
    const result = await collectStream(stream);
    expect(result.toString()).toBe('abcdef');
  });

  it('stream vide retourne Buffer vide', async () => {
    async function* gen() {}
    const result = await collectStream(gen());
    expect(result.length).toBe(0);
  });
});
