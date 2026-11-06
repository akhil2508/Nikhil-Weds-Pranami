export interface BlessingEntry {
  id: string;
  name: string;
  attending: string;
  dancing: string;
  song?: string;
  message: string;
  timestamp: string;
  likes: number;
}

function normalizeBlessings(value: unknown): BlessingEntry[] {
  if (!Array.isArray(value)) {
    throw new Error('The Google Sheets response was not a list.');
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('The Google Sheets response contains an invalid entry.');
    }

    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== 'string' || typeof entry.name !== 'string' || typeof entry.message !== 'string') {
      throw new Error('The Google Sheets response contains an incomplete entry.');
    }

    return {
      id: entry.id,
      name: entry.name,
      attending: typeof entry.attending === 'string' ? entry.attending : 'No',
      dancing: typeof entry.dancing === 'string' ? entry.dancing : 'No',
      song: typeof entry.song === 'string' ? entry.song : undefined,
      message: entry.message,
      timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : '',
      likes: typeof entry.likes === 'number' ? entry.likes : 1,
    };
  });
}

export function loadBlessings(endpoint: string): Promise<BlessingEntry[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `__weddingBlessings_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const url = new URL(endpoint);
    let timeout: number;

    const cleanup = () => {
      window.clearTimeout(timeout);
      Reflect.deleteProperty(window, callbackName);
      script.remove();
    };

    Reflect.set(window, callbackName, (value: unknown) => {
      cleanup();
      try {
        resolve(normalizeBlessings(value));
      } catch (error) {
        reject(error);
      }
    });

    url.searchParams.set('action', 'list');
    url.searchParams.set('callback', callbackName);
    script.src = url.toString();
    script.onerror = () => {
      cleanup();
      reject(new Error('Could not load blessings from Google Sheets.'));
    };
    timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while loading blessings from Google Sheets.'));
    }, 15000);
    document.head.appendChild(script);
  });
}

export async function saveBlessingToSheets(endpoint: string, entry: BlessingEntry): Promise<BlessingEntry[]> {
  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(entry),
  });

  const savedEntries = await loadBlessings(endpoint);
  if (!savedEntries.some((savedEntry) => savedEntry.id === entry.id)) {
    throw new Error('Google Sheets did not confirm the RSVP. This message is saved only in this browser.');
  }

  return savedEntries;
}
