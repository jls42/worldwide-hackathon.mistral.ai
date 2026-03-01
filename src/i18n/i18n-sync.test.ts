import { describe, it, expect } from 'vitest';
import { fr } from './fr';
import { en } from './en';

describe('i18n dictionaries sync', () => {
  const frKeys = Object.keys(fr).sort((a, b) => a.localeCompare(b));
  const enKeys = Object.keys(en).sort((a, b) => a.localeCompare(b));

  it('en.ts should have all keys from fr.ts', () => {
    const missingInEn = frKeys.filter((k) => !(k in en));
    expect(missingInEn, `Missing keys in en.ts: ${missingInEn.join(', ')}`).toEqual([]);
  });

  it('fr.ts should have all keys from en.ts', () => {
    const missingInFr = enKeys.filter((k) => !(k in fr));
    expect(missingInFr, `Extra keys in en.ts not in fr.ts: ${missingInFr.join(', ')}`).toEqual([]);
  });

  it('both dictionaries should have the same number of keys', () => {
    expect(enKeys.length).toBe(frKeys.length);
  });

  it('no key should have an empty value in fr.ts', () => {
    const emptyFr = frKeys.filter((k) => fr[k].trim() === '');
    expect(emptyFr, `Empty values in fr.ts: ${emptyFr.join(', ')}`).toEqual([]);
  });

  it('no key should have an empty value in en.ts', () => {
    const emptyEn = enKeys.filter((k) => en[k].trim() === '');
    expect(emptyEn, `Empty values in en.ts: ${emptyEn.join(', ')}`).toEqual([]);
  });

  it('interpolation placeholders should match between fr and en', () => {
    const placeholderRegex = /\{(\w+)\}/g;
    const mismatches: string[] = [];

    for (const key of frKeys) {
      if (!(key in en)) continue;
      const frPlaceholders = [...fr[key].matchAll(placeholderRegex)]
        .map((m) => m[1])
        .sort((a, b) => a.localeCompare(b));
      const enPlaceholders = [...en[key].matchAll(placeholderRegex)]
        .map((m) => m[1])
        .sort((a, b) => a.localeCompare(b));
      if (JSON.stringify(frPlaceholders) !== JSON.stringify(enPlaceholders)) {
        mismatches.push(
          `${key}: fr={${frPlaceholders.join(',')}} en={${enPlaceholders.join(',')}}`,
        );
      }
    }

    expect(mismatches, `Placeholder mismatches:\n${mismatches.join('\n')}`).toEqual([]);
  });
});
