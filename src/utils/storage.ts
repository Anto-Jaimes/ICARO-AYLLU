import { CommunityItem } from '../types';

const STORAGE_KEY = 'icaro_ayllu_items_v2';
const OFFLINE_QUEUE_KEY = 'icaro_ayllu_offline_queue_v2';

function readList(key: string): CommunityItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return [];
  }
}

function writeList(key: string, items: CommunityItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

/** Last feed received from the server, shown while there is no connection. */
export function loadItemsFromStorage(): CommunityItem[] {
  return readList(STORAGE_KEY);
}

export function saveItemsToStorage(items: CommunityItem[]): void {
  writeList(STORAGE_KEY, items);
}

export function getOfflineQueue(): CommunityItem[] {
  return readList(OFFLINE_QUEUE_KEY);
}

export function queueOfflineItem(item: CommunityItem): void {
  writeList(OFFLINE_QUEUE_KEY, [...getOfflineQueue(), item]);
}

export function removeFromOfflineQueue(id: string): void {
  writeList(OFFLINE_QUEUE_KEY, getOfflineQueue().filter((item) => item.id !== id));
}

export function getOfflineQueueCount(): number {
  return getOfflineQueue().length;
}
