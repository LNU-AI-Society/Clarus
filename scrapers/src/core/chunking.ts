import type { ChunkSlice } from './types.js';

export function chunkTextByWords(text: string, chunkSize: number, chunkOverlap: number): ChunkSlice[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  if (words.length <= chunkSize) {
    return [
      {
        chunkText: words.join(' '),
        startWord: 0,
        endWord: words.length,
      },
    ];
  }

  const chunks: ChunkSlice[] = [];
  const step = Math.max(1, chunkSize - chunkOverlap);

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(words.length, start + chunkSize);
    const chunkWords = words.slice(start, end);
    if (chunkWords.length === 0) break;

    chunks.push({
      chunkText: chunkWords.join(' '),
      startWord: start,
      endWord: end,
    });

    if (end >= words.length) break;
  }

  return chunks;
}
