import { once } from 'node:events';
import type { WriteStream } from 'node:fs';

export async function writeJsonlLine(stream: WriteStream, data: unknown): Promise<void> {
  const serialized = `${JSON.stringify(data)}\n`;
  if (!stream.write(serialized)) {
    await once(stream, 'drain');
  }
}

export async function closeWriteStream(stream: WriteStream): Promise<void> {
  stream.end();
  await once(stream, 'finish');
}
