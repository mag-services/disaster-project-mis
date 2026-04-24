/**
 * IndexedDB storage for offline area administrator drafts.
 * Used by PWA to save drafts when offline and sync when back online.
 */
import type { CreateSubmissionPayload } from "@/api/areaSubmissions";

const DB_NAME = "drmis-offline";
const DB_VERSION = 1;
const STORE_DRAFTS = "area-drafts";
const STORE_CACHE = "cache";

export interface OfflineDraft {
  id: string;
  payload: CreateSubmissionPayload;
  createdAt: string;
  datasetName?: string;
  provinceName?: string;
  areaCouncilName?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
    };
  });
}

export async function saveOfflineDraft(
  payload: CreateSubmissionPayload,
  meta?: { datasetName?: string; provinceName?: string; areaCouncilName?: string },
): Promise<string> {
  const id = `local-${crypto.randomUUID()}`;
  const draft: OfflineDraft = {
    id,
    payload,
    createdAt: new Date().toISOString(),
    ...meta,
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    tx.objectStore(STORE_DRAFTS).put(draft);
    tx.oncomplete = () => {
      db.close();
      resolve(id);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function updateOfflineDraft(
  id: string,
  payload: CreateSubmissionPayload,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const store = tx.objectStore(STORE_DRAFTS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as OfflineDraft | undefined;
      if (!existing) {
        reject(new Error("Draft not found"));
        return;
      }
      store.put({ ...existing, payload, createdAt: new Date().toISOString() });
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getOfflineDrafts(): Promise<OfflineDraft[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const req = tx.objectStore(STORE_DRAFTS).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as OfflineDraft[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ));
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteOfflineDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    tx.objectStore(STORE_DRAFTS).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getOfflineDraft(id: string): Promise<OfflineDraft | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const req = tx.objectStore(STORE_DRAFTS).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function getCachedAreas(): Promise<unknown | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, "readonly");
    const req = tx.objectStore(STORE_CACHE).get("area-admin-areas");
    req.onsuccess = () => {
      db.close();
      resolve(req.result?.value ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function setCachedAreas(areas: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, "readwrite");
    tx.objectStore(STORE_CACHE).put({ key: "area-admin-areas", value: areas });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCachedDatasets(): Promise<unknown | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, "readonly");
    const req = tx.objectStore(STORE_CACHE).get("tabular-datasets");
    req.onsuccess = () => {
      db.close();
      resolve(req.result?.value ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function setCachedDatasets(datasets: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, "readwrite");
    tx.objectStore(STORE_CACHE).put({ key: "tabular-datasets", value: datasets });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
