import { PullRequestAnalysis, RawPRApiEntry } from './types';
import { mapRawEntry } from './mock-data';

// NOTE: For a private bin you must supply an X-Master-Key or X-Access-Key via env.
// We attempt an unauthenticated fetch first; if it fails, we throw a descriptive error.

const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '68cd81e7ae596e708ff41711';

interface JsonBinSuccessResp<T> {
  record: T;
  metadata: unknown;
}

function envKey(): string | undefined {
  if (typeof process !== 'undefined') {
    return process.env.JSONBIN_ACCESS_KEY || process.env.JSONBIN_MASTER_KEY;
  }
  return undefined;
}

export async function fetchPRDataFromJsonBin(): Promise<PullRequestAnalysis[]> {
  const url = `${JSONBIN_BASE}/${BIN_ID}/latest`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = envKey();
  if (key) headers['X-Master-Key'] = key; // prefer master key for read/write; access key also works for read

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JSONBin fetch failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as JsonBinSuccessResp<Record<string, RawPRApiEntry>>;
  if (!json || typeof json.record !== 'object') {
    return [];
  }
  const entries = json.record;
  return Object.keys(entries).map((k) => mapRawEntry(k, entries[k]));
}
