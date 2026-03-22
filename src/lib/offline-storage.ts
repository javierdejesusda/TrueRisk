const DB_NAME = 'truerisk-offline';
const DB_VERSION = 2;
const STORES = [
  'riskScores',
  'alerts',
  'emergencyGuidance',
  'weather',
  'emergencyContacts',
] as const;
type StoreName = (typeof STORES)[number];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Create only missing stores — preserves existing data on upgrade
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function save<T>(store: StoreName, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(data, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB not available (SSR, private browsing)
  }
}

export async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined;
  }
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}
