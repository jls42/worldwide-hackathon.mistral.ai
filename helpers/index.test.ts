import { describe, it, expect } from 'vitest';
import {
  stripJsonMarkdown,
  safeParseJson,
  unwrapJsonArray,
  extractAllText,
  timer,
} from './index.js';

describe('stripJsonMarkdown', () => {
  it('retire les blocs ```json ```', () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripJsonMarkdown(input)).toBe('{"a":1}');
  });

  it('laisse le texte sans markdown inchange', () => {
    expect(stripJsonMarkdown('{"b":2}')).toBe('{"b":2}');
  });

  it('gere une string vide', () => {
    expect(stripJsonMarkdown('')).toBe('');
  });
});

describe('safeParseJson', () => {
  it('parse du JSON valide', () => {
    expect(safeParseJson('{"x":1}')).toEqual({ x: 1 });
  });

  it('parse du JSON wrappe dans du markdown', () => {
    expect(safeParseJson('```json\n{"x":1}\n```')).toEqual({ x: 1 });
  });

  it('throw sur du JSON invalide', () => {
    expect(() => safeParseJson('not json')).toThrow();
  });
});

describe('unwrapJsonArray', () => {
  it('retourne un array direct', () => {
    expect(unwrapJsonArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('unwrap un objet {key: [...]}', () => {
    expect(unwrapJsonArray({ items: [1, 2] })).toEqual([1, 2]);
  });

  it('retourne [] pour un objet sans array', () => {
    expect(unwrapJsonArray({ a: 'b' })).toEqual([]);
  });

  it('retourne [] pour null', () => {
    expect(unwrapJsonArray(null)).toEqual([]);
  });
});

describe('extractAllText', () => {
  it('extrait les proprietes .text', () => {
    const result = extractAllText([{ text: 'hello' }, { text: 'world' }]);
    expect(result).toBe('hello\nworld');
  });

  it('extrait les proprietes .content string', () => {
    const result = extractAllText([{ content: 'bonjour' }]);
    expect(result).toBe('bonjour');
  });

  it('extrait recursivement les .content array', () => {
    const result = extractAllText([{ content: [{ text: 'nested' }] }]);
    expect(result).toBe('nested');
  });

  it('extrait recursivement les .outputs', () => {
    const result = extractAllText([{ outputs: [{ text: 'deep' }] }]);
    expect(result).toBe('deep');
  });

  it('extrait les .output string et array', () => {
    const result = extractAllText([{ output: 'direct' }, { output: [{ text: 'arr' }] }]);
    expect(result).toBe('direct\narr');
  });

  it('gere un array vide', () => {
    expect(extractAllText([])).toBe('');
  });
});

describe('timer', () => {
  it('retourne une fonction', () => {
    const stop = timer();
    expect(typeof stop).toBe('function');
  });

  it('retourne un temps >= 0', () => {
    const stop = timer();
    const elapsed = stop();
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
