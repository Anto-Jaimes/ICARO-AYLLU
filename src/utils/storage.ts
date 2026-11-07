import { CommunityItem, UserLocation } from '../types';

const STORAGE_KEY = 'icaro_ayllu_items_v2';
const OFFLINE_QUEUE_KEY = 'icaro_ayllu_offline_queue_v2';
const LOCATION_KEY = 'icaro_ayllu_last_location_v1';
const CONTACT_KEY = 'icaro_ayllu_contact_v1';

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

/** Last real GPS position, so a neighbour opening the app offline still sees their area. */
export function loadLastLocation(): UserLocation | null {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? 'null');
    return typeof saved?.lat === 'number' && typeof saved?.lng === 'number' ? saved : null;
  } catch {
    return null;
  }
}

export function saveLastLocation(location: UserLocation): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch (err) {
    console.error('Error saving location:', err);
  }
}

export interface SavedContact {
  name: string;
  phone: string;
}

/** Name and phone from the last post, so publishing again needs no typing. */
export function loadContact(): SavedContact {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? 'null');
    return { name: saved?.name ?? '', phone: saved?.phone ?? '' };
  } catch {
    return { name: '', phone: '' };
  }
}

export function saveContact(contact: SavedContact): void {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
  } catch (err) {
    console.error('Error saving contact:', err);
  }
}
