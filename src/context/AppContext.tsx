import React, { createContext, useCallback, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { CommunityItem, Mode, UserLocation, Review } from '../types';
import { DEFAULT_USER_LOCATION } from '../data/defaultLocation';
import {
  loadItemsFromStorage,
  saveItemsToStorage,
  queueOfflineItem,
  getOfflineQueue,
  getOfflineQueueCount,
  removeFromOfflineQueue
} from '../utils/storage';
import { calculateDistanceMeters } from '../utils/geo';
import { reverseGeocode } from '../services/geoService';
import {
  createPost,
  fetchNearbyPosts,
  isRejectedByServer,
  setPostStatus,
  setVote,
  submitReview,
  subscribeToPostChanges
} from '../services/postsService';
import confetti from 'canvas-confetti';

function celebrate(particleCount: number, spread: number, originY: number) {
  try {
    confetti({ particleCount, spread, origin: { y: originY } });
  } catch {
    // Purely decorative: never let it interrupt the action.
  }
}

// Posts still waiting to reach the server stay visible to their author.
function withPendingPosts(items: CommunityItem[]): CommunityItem[] {
  const pending = getOfflineQueue().filter((queued) => !items.some((item) => item.id === queued.id));
  return [...pending, ...items];
}

interface AppContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  activeTab: 'services' | 'favors' | 'emergency_board' | 'map';
  setActiveTab: (tab: 'services' | 'favors' | 'emergency_board' | 'map') => void;
  items: CommunityItem[];
  filteredItems: CommunityItem[];
  userLocation: UserLocation;
  updateUserLocation: (lat: number, lng: number, name?: string) => void;
  requestCurrentGPS: () => void;
  isOnline: boolean;
  pendingOfflineCount: number;
  maxDistanceMeters: number;
  setMaxDistanceMeters: (val: number) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedItemForDetail: CommunityItem | null;
  setSelectedItemForDetail: (item: CommunityItem | null) => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
  toggleVistoBueno: (id: string) => void;
  addReview: (itemId: string, comment: string, reviewerName: string) => void;
  addItem: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'vistosBuenos' | 'reviews'>) => void;
  updateItemStatus: (id: string, status: 'active' | 'in_progress' | 'resolved') => void;
  notice: string | null;
  clearNotice: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    return (localStorage.getItem('icaro_ayllu_mode') as Mode) || 'normal';
  });
  
  const [activeTab, setActiveTabState] = useState<'services' | 'favors' | 'emergency_board' | 'map'>('services');
  const [items, setItems] = useState<CommunityItem[]>(() => withPendingPosts(loadItemsFromStorage()));
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_USER_LOCATION);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(getOfflineQueueCount());
  const [notice, setNotice] = useState<string | null>(null);

  const [maxDistanceMeters, setMaxDistanceMeters] = useState<number>(3000);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Each tab has its own categories: one chosen in Favores must not silently empty Oficios.
  const setActiveTab = (tab: 'services' | 'favors' | 'emergency_board' | 'map') => {
    setActiveTabState(tab);
    setSelectedCategory('all');
  };

  // Keep the id, not a copy, so an open detail shows live votes and recommendations.
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    return !localStorage.getItem('icaro_ayllu_tutorial_seen');
  });

  const latestFetch = useRef(0);
  const isFlushingQueue = useRef(false);

  const clearNotice = useCallback(() => setNotice(null), []);

  const refreshItems = useCallback(async () => {
    const fetchId = ++latestFetch.current;
    try {
      const remoteItems = await fetchNearbyPosts(userLocation.lat, userLocation.lng);
      // A slower, older response must not overwrite a newer one.
      if (fetchId === latestFetch.current) setItems(withPendingPosts(remoteItems));
    } catch (err) {
      console.warn('No se pudieron actualizar las publicaciones:', err);
      if (navigator.onLine) setNotice('No pudimos actualizar. Mostrando lo último guardado.');
    }
  }, [userLocation.lat, userLocation.lng]);

  // A post leaves the queue only once the server has confirmed it.
  const flushOfflineQueue = useCallback(async () => {
    if (isFlushingQueue.current || !navigator.onLine) return;
    isFlushingQueue.current = true;

    try {
      let item: CommunityItem | undefined;
      while ((item = getOfflineQueue()[0])) {
        const { id, title } = item;
        try {
          await createPost(item);
          removeFromOfflineQueue(id);
        } catch (err) {
          if (!isRejectedByServer(err)) {
            console.warn('Sin conexión con el servidor, se reintentará:', err);
            break;
          }
          console.error('Publicación rechazada por el servidor:', err);
          removeFromOfflineQueue(id);
          setItems((prev) => prev.filter((existing) => existing.id !== id));
          setNotice(`No se pudo publicar "${title}". Revisa los datos e inténtalo de nuevo.`);
        }
      }
    } finally {
      isFlushingQueue.current = false;
      setPendingOfflineCount(getOfflineQueueCount());
    }
  }, []);

  // Keep the feed in sync: on load, on reconnect, and whenever a neighbour changes something.
  useEffect(() => {
    const syncFeed = async () => {
      await flushOfflineQueue();
      await refreshItems();
    };
    const handleOnline = () => {
      setIsOnline(true);
      syncFeed();
    };
    const handleOffline = () => setIsOnline(false);

    syncFeed();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = subscribeToPostChanges(refreshItems);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [flushOfflineQueue, refreshItems]);

  // Last known feed, for reading without connection
  useEffect(() => {
    saveItemsToStorage(items);
  }, [items]);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('icaro_ayllu_mode', newMode);
    if (newMode === 'emergency') {
      setActiveTab('emergency_board');
    } else {
      if (activeTab === 'emergency_board') {
        setActiveTab('services');
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'normal' ? 'emergency' : 'normal');
  };

  const updateUserLocation = async (lat: number, lng: number, name?: string) => {
    let resolvedName = name;
    if (!resolvedName) {
      resolvedName = await reverseGeocode(lat, lng);
    }
    setUserLocation({
      lat,
      lng,
      name: resolvedName
    });
  };

  const requestCurrentGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const streetAddress = await reverseGeocode(lat, lng);
          updateUserLocation(lat, lng, streetAddress);
        },
        (err) => {
          console.warn('Geolocation unavailable, keeping current coordinates:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // The database enforces both rules too; checking here gives the neighbour a clear reason.
  const canRecommend = (item: CommunityItem | undefined): item is CommunityItem => {
    if (!item) return false;
    if (item.isMine) {
      setNotice('No puedes recomendar tu propia publicación.');
      return false;
    }
    if (!navigator.onLine) {
      setNotice('Necesitas conexión para recomendar.');
      return false;
    }
    return true;
  };

  const applyVote = (id: string, voted: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, hasUserVoted: voted, vistosBuenos: item.vistosBuenos + (voted ? 1 : -1) }
          : item
      )
    );
  };

  const toggleVistoBueno = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!canRecommend(item)) return;

    const voted = !item.hasUserVoted;
    if (voted) celebrate(40, 60, 0.7);
    applyVote(id, voted);

    setVote(id, voted).catch((err) => {
      console.error('No se pudo guardar el voto:', err);
      applyVote(id, !voted);
      setNotice('No se pudo guardar tu recomendación. Inténtalo de nuevo.');
    });
  };

  const addReview = async (itemId: string, comment: string, reviewerName: string) => {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!canRecommend(item)) return;

    const authorName = reviewerName || 'Vecino de la zona';
    const optimisticReview: Review = {
      id: `pending-${Date.now()}`,
      authorName,
      comment,
      date: 'Hace un momento',
      isNeighborVerified: false
    };

    setItems((prev) =>
      prev.map((candidate) =>
        candidate.id === itemId
          ? {
              ...candidate,
              hasUserVoted: true,
              vistosBuenos: candidate.vistosBuenos + (candidate.hasUserVoted ? 0 : 1),
              reviews: [optimisticReview, ...candidate.reviews]
            }
          : candidate
      )
    );

    try {
      await submitReview(itemId, authorName, comment, userLocation.lat, userLocation.lng);
    } catch (err) {
      console.error('No se pudo guardar la recomendación:', err);
      setNotice('No se pudo guardar tu recomendación. Inténtalo de nuevo.');
    }
    await refreshItems();
  };

  // Every post goes through the queue, so online and offline share one path and a
  // post survives the app closing before the server has answered.
  const addItem = async (itemData: Omit<CommunityItem, 'id' | 'createdAt' | 'vistosBuenos' | 'reviews'>) => {
    const newItem: CommunityItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: 'Hace un momento',
      vistosBuenos: 0,
      reviews: [],
      isMine: true,
      isOfflineCreated: !navigator.onLine
    };

    queueOfflineItem(newItem);
    setPendingOfflineCount(getOfflineQueueCount());
    setItems((prev) => [newItem, ...prev]);
    celebrate(60, 80, 0.6);

    await flushOfflineQueue();
    if (navigator.onLine) await refreshItems();
  };

  const updateItemStatus = (id: string, status: 'active' | 'in_progress' | 'resolved') => {
    const previousStatus = items.find((item) => item.id === id)?.status;
    if (!previousStatus) return;

    if (!navigator.onLine) {
      setNotice('Necesitas conexión para cambiar el estado.');
      return;
    }

    const applyStatus = (nextStatus: CommunityItem['status']) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    };

    applyStatus(status);
    setPostStatus(id, status).catch((err) => {
      console.error('No se pudo cambiar el estado:', err);
      applyStatus(previousStatus);
      setNotice('No se pudo cambiar el estado. Inténtalo de nuevo.');
    });
  };

  const itemsWithDistance = useMemo(() => {
    return items.map((item) => {
      const distance = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        item.coordinates[0],
        item.coordinates[1]
      );
      return {
        ...item,
        distanceMeters: distance
      };
    });
  }, [items, userLocation]);

  const selectedItemForDetail = useMemo(
    () => itemsWithDistance.find((item) => item.id === selectedItemId) ?? null,
    [itemsWithDistance, selectedItemId]
  );

  const setSelectedItemForDetail = (item: CommunityItem | null) => setSelectedItemId(item?.id ?? null);

  const filteredItems = useMemo(() => {
    return itemsWithDistance.filter((item) => {
      if (mode === 'emergency') {
        if (activeTab === 'emergency_board') {
          if (!['emergency_need', 'emergency_resource', 'support_group'].includes(item.type)) {
            return false;
          }
        }
      } else {
        if (activeTab === 'services' && item.type !== 'service') return false;
        if (activeTab === 'favors' && !['favor_offer', 'favor_request'].includes(item.type)) return false;
      }

      if (item.distanceMeters !== undefined && item.distanceMeters > maxDistanceMeters) {
        return false;
      }

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesAuthor = item.authorName.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesNeighbor = item.neighborhood.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesCat && !matchesNeighbor) {
          return false;
        }
      }

      return true;
    });
  }, [itemsWithDistance, mode, activeTab, maxDistanceMeters, selectedCategory, searchQuery]);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        activeTab,
        setActiveTab,
        items: itemsWithDistance,
        filteredItems,
        userLocation,
        updateUserLocation,
        requestCurrentGPS,
        isOnline,
        pendingOfflineCount,
        maxDistanceMeters,
        setMaxDistanceMeters,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedItemForDetail,
        setSelectedItemForDetail,
        isPublishModalOpen,
        setIsPublishModalOpen,
        isTutorialOpen,
        setIsTutorialOpen,
        toggleVistoBueno,
        addReview,
        addItem,
        updateItemStatus,
        notice,
        clearNotice
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
