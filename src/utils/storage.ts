import { CommunityItem } from '../types';
import { INITIAL_ITEMS } from '../data/mockData';

const STORAGE_KEY = 'icaro_ayllu_items_v1';
const OFFLINE_QUEUE_KEY = 'icaro_ayllu_offline_queue_v1';

export function loadItemsFromStorage(): CommunityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ITEMS;
  } catch (err) {
    console.error('Error loading items from localStorage:', err);
    return INITIAL_ITEMS;
  }
}

export function saveItemsToStorage(items: CommunityItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving items to localStorage:', err);
  }
}

export function queueOfflineItem(item: CommunityItem): void {
  try {
    const queueRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: CommunityItem[] = queueRaw ? JSON.parse(queueRaw) : [];
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error queueing offline item:', err);
  }
}

export function getOfflineQueueCount(): number {
  try {
    const queueRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueRaw ? JSON.parse(queueRaw) : [];
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error('Error clearing offline queue:', err);
  }
}
