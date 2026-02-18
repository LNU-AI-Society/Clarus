import { createHash } from 'node:crypto';

export function parseIntegerOption(name: string, raw: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid value for ${name}: ${raw}`);
  }
  return parsed;
}

export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/([a-z\u00E5\u00E4\u00F6])([A-Z\u00C5\u00C4\u00D6])/g, '$1 $2')
    .replace(/([.!?])([A-Z\u00C5\u00C4\u00D6])/g, '$1 $2')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
