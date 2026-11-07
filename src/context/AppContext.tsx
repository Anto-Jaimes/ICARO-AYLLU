import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { CommunityItem, Mode, UserLocation, Review } from '../types';
import { INITIAL_USER_LOCATION } from '../data/mockData';
import { loadItemsFromStorage, saveItemsToStorage, queueOfflineItem, getOfflineQueueCount, clearOfflineQueue } from '../utils/storage';
import { calculateDistanceMeters } from '../utils/geo';
import confetti from 'canvas-confetti';

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
  maxDistanceMeters: number; // 500, 1000, 3000, or 100000 (all)
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
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    return (localStorage.getItem('icaro_ayllu_mode') as Mode) || 'normal';
  });
  
  const [activeTab, setActiveTab] = useState<'services' | 'favors' | 'emergency_board' | 'map'>('services');
  const [items, setItems] = useState<CommunityItem[]>(() => loadItemsFromStorage());
  const [userLocation, setUserLocation] = useState<UserLocation>(INITIAL_USER_LOCATION);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(getOfflineQueueCount());
  
  const [maxDistanceMeters, setMaxDistanceMeters] = useState<number>(3000); // 3 km default
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<CommunityItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    return !localStorage.getItem('icaro_ayllu_tutorial_seen');
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Attempt auto sync
      const count = getOfflineQueueCount();
      if (count > 0) {
        clearOfflineQueue();
        setPendingOfflineCount(0);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save items on change
  useEffect(() => {
    saveItemsToStorage(items);
  }, [items]);

  // Sync mode with emergency tab
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

  const updateUserLocation = (lat: number, lng: number, name?: string) => {
    setUserLocation({
      lat,
      lng,
      name: name || 'Mi ubicación actual'
    });
  };

  const requestCurrentGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude, 'Mi GPS en vivo');
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using neighborhood center:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Give Visto Bueno Vecinal
  const toggleVistoBueno = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isVoted = item.hasUserVoted;
          if (!isVoted) {
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.7 }
              });
            } catch {
              // Ignore confetti error
            }
          }
          return {
            ...item,
            vistosBuenos: isVoted ? item.vistosBuenos - 1 : item.vistosBuenos + 1,
            hasUserVoted: !isVoted
          };
        }
        return item;
      })
    );
  };

  // Add review
  const addReview = (itemId: string, comment: string, reviewerName: string) => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      authorName: reviewerName || 'Vecino de la zona',
      comment,
      date: 'Reciente',
      isNeighborVerified: true
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            vistosBuenos: item.vistosBuenos + 1,
            reviews: [newReview, ...item.reviews]
          };
        }
        return item;
      })
    );
  };

  // Add item (with 3-click fast publish & offline support)
  const addItem = (itemData: Omit<CommunityItem, 'id' | 'createdAt' | 'vistosBuenos' | 'reviews'>) => {
    const newItem: CommunityItem = {
      ...itemData,
      id: `post-${Date.now()}`,
      createdAt: 'Hace un momento',
      vistosBuenos: 1, // First visto bueno by default
      reviews: [],
      isOfflineCreated: !isOnline
    };

    if (!isOnline) {
      queueOfflineItem(newItem);
      setPendingOfflineCount((prev) => prev + 1);
    }

    setItems((prev) => [newItem, ...prev]);

    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore confetti
    }
  };

  const updateItemStatus = (id: string, status: 'active' | 'in_progress' | 'resolved') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const resetToDefaultData = () => {
    localStorage.removeItem('icaro_ayllu_items_v1');
    localStorage.removeItem('icaro_ayllu_offline_queue_v1');
    window.location.reload();
  };

  // Calculated items with distance
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

  // Filtered items according to active tab, mode, search, distance, category
  const filteredItems = useMemo(() => {
    return itemsWithDistance.filter((item) => {
      // Tab filter
      if (mode === 'emergency') {
        // In emergency mode, emergency_board and map display emergency items
        if (activeTab === 'emergency_board') {
          if (!['emergency_need', 'emergency_resource', 'support_group'].includes(item.type)) {
            return false;
          }
        }
      } else {
        // Normal mode
        if (activeTab === 'services' && item.type !== 'service') return false;
        if (activeTab === 'favors' && !['favor_offer', 'favor_request'].includes(item.type)) return false;
      }

      // Distance filter
      if (item.distanceMeters !== undefined && item.distanceMeters > maxDistanceMeters) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search query
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
        resetToDefaultData
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
