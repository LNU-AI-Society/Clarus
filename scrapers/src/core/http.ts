import { gunzipSync } from 'node:zlib';

import { sleep } from './utils.js';
import type { FetchTextResult } from './types.js';

export interface HttpRequestOptions {
  userAgent: string;
  timeoutMs: number;
  retries: number;
}

export async function fetchTextWithRetries(
  url: string,
  options: HttpRequestOptions,
): Promise<FetchTextResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': options.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type');
      const binaryBody = Buffer.from(await response.arrayBuffer());
      const shouldGunzip =
        (contentType || '').toLowerCase().includes('gzip') ||
        response.url.toLowerCase().endsWith('.gz') ||
        (binaryBody.length > 2 && binaryBody[0] === 0x1f && binaryBody[1] === 0x8b);

      let bodyBuffer = binaryBody;
      if (shouldGunzip) {
        try {
          bodyBuffer = gunzipSync(binaryBody);
        } catch {
          bodyBuffer = binaryBody;
        }
      }

      const result: FetchTextResult = {
        status: response.status,
        body: bodyBuffer.toString('utf8'),
        finalUrl: response.url || url,
        contentType,
      };

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (shouldRetry && attempt < options.retries) {
        await sleep(Math.min(1200 * attempt, 5000));
        continue;
      }

      return result;
    } catch (error: unknown) {
      lastError = error;
      if (attempt >= options.retries) {
        throw error;
      }
      await sleep(Math.min(1200 * attempt, 5000));
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  throw new Error(`Failed to fetch ${url}. Last error: ${String(lastError)}`);
}
