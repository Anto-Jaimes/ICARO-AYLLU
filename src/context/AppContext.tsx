import React, { createContext, useCallback, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { CommunityItem, Mode, PostType, UserLocation, Review } from '../types';
import { fetchUserCode } from '../services/userCodeService';
import { clearQueuedCall, queueCall, queuedCall, requestCall } from '../services/callService';
import { isSignedOut as wasSignedOut, signOutOfApp } from '../services/accountService';
import { DEFAULT_USER_LOCATION } from '../data/defaultLocation';
import {
  loadItemsFromStorage,
  saveItemsToStorage,
  queueOfflineItem,
  getOfflineQueue,
  getOfflineQueueCount,
  loadLastLocation,
  removeFromOfflineQueue,
  saveLastLocation
} from '../utils/storage';
import { calculateDistanceMeters, isInPeru } from '../utils/geo';
import { tr } from '../i18n/translate';
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
import { tapFeedback } from '../lib/native';
import { supabase } from '../lib/supabase';
import type { Report, ReportKind } from '../services/reportsService';
import type { Session } from '@supabase/supabase-js';

const IS_NATIVE = Capacitor.isNativePlatform();
/** Set once the web visitor chose at the door (enter with the code, or only look). */
const WEB_DOOR_KEY = 'ayllu_web_door';

/**
 * On the web, only a session made with the code and the app's key may write. It is recognised by the
 * internal address web-login gives the user, not by being "not anonymous": the moderators' panel lives
 * on the same site and its session must not count as a neighbour.
 */
export const isWebMemberSession = (session: Session | null) =>
  Boolean(session?.user.email?.endsWith('@usuarios.ayllu.invalid'));

export type Tab = 'home' | 'services' | 'favors' | 'map' | 'neighbors' | 'resources' | 'groups';
export type LocationStatus = 'locating' | 'ready' | 'denied' | 'unavailable';

/** What a publish flow starts from when another screen already knows the intent. */
export interface PublishPreset {
  type: PostType;
  category: string;
  title: string;
}

export interface ServicesFilter {
  category?: string;
  query?: string;
}

const NORMAL_HOME: Tab = 'home';
const EMERGENCY_HOME: Tab = 'neighbors';
const LOCATED_NAME = 'Tu ubicación';

/** The name saved with a recommendation left without one; shown translated, stored in Spanish. */
export const ANONYMOUS_REVIEWER = 'Vecino de la zona';

// Posts still waiting to reach the server stay visible to their author.
function withPendingPosts(items: CommunityItem[]): CommunityItem[] {
  const pending = getOfflineQueue().filter((queued) => !items.some((item) => item.id === queued.id));
  return [...pending, ...items];
}

interface AppContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
  homeTab: Tab;
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
  isNewsOpen: boolean;
  setIsNewsOpen: (open: boolean) => void;
  reportKind: ReportKind | null;
  /** The news open in detail (photo, place, comments), or null. */
  newsDetail: Report | null;
  openNewsDetail: (report: Report) => void;
  closeNewsDetail: () => void;
  openReport: (kind: ReportKind) => void;
  closeReport: () => void;
  /** Changes after publishing, so every news list reloads. */
  reportsVersion: number;
  refreshReports: () => void;
  servicesFilter: ServicesFilter;
  openServices: (filter?: ServicesFilter) => void;
  items: CommunityItem[];
  userLocation: UserLocation;
  /** False while userLocation is only the default point, so nothing may claim to describe "your zone". */
  hasLocation: boolean;
  locationStatus: LocationStatus;
  requestCurrentGPS: () => void;
  isOnline: boolean;
  pendingOfflineCount: number;
  /** True until the first answer, so an empty list is not read as "nobody nearby". */
  isLoadingItems: boolean;
  selectedItem: CommunityItem | null;
  openItem: (id: string) => void;
  closeItem: () => void;
  isPublishOpen: boolean;
  publishPreset: PublishPreset | null;
  openPublish: (preset?: PublishPreset) => void;
  closePublish: () => void;
  isSosOpen: boolean;
  setIsSosOpen: (open: boolean) => void;
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isMuralOpen: boolean;
  setIsMuralOpen: (open: boolean) => void;
  /** "Avisos en tu celular": turn the phone alerts on or off, and send a test. */
  isPushOpen: boolean;
  setIsPushOpen: (open: boolean) => void;
  isBatterySaver: boolean;
  setIsBatterySaver: (active: boolean) => void;
  toggleVistoBueno: (id: string) => void;
  addReview: (itemId: string, comment: string, reviewerName: string) => void;
  addItem: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'vistosBuenos' | 'reviews'>) => void;
  updateItemStatus: (id: string, status: CommunityItem['status']) => void;
  /** The app while signed in; the web only after entering with the user code and the app's key. */
  canWrite: boolean;
  isWebMember: boolean;
  /** The app after "Cerrar sesión": it only looks until the neighbour enters with their number. */
  isSignedOut: boolean;
  signOut: () => Promise<void>;
  /** After entering with the number, or choosing a new account: the app may write again. */
  finishSignIn: () => void;
  isAccessOpen: boolean;
  /** Why the door opened (for example, "to publish"), or null at the first visit. */
  accessReason: string | null;
  openAccess: (reason?: string) => void;
  /** Closes the door; "viewer" remembers that this visitor chose to only look. */
  closeAccess: (choice?: 'viewer' | 'member') => void;
  notice: string | null;
  showNotice: (message: string) => void;
  clearNotice: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    return (localStorage.getItem('icaro_ayllu_mode') as Mode) || 'normal';
  });
  const homeTab = mode === 'emergency' ? EMERGENCY_HOME : NORMAL_HOME;

  const [tab, setTabState] = useState<Tab>(homeTab);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isNewsOpen, setIsNewsOpen] = useState<boolean>(false);
  const [reportKind, setReportKind] = useState<ReportKind | null>(null);
  const [newsDetail, setNewsDetail] = useState<Report | null>(null);
  const openNewsDetail = useCallback((report: Report) => setNewsDetail(report), []);
  const closeNewsDetail = useCallback(() => setNewsDetail(null), []);
  const [reportsVersion, setReportsVersion] = useState<number>(0);
  const [servicesFilter, setServicesFilter] = useState<ServicesFilter>({});

  const [items, setItems] = useState<CommunityItem[]>(() => withPendingPosts(loadItemsFromStorage()));
  const [savedLocation] = useState<UserLocation | null>(() => loadLastLocation());
  const [userLocation, setUserLocation] = useState<UserLocation>(savedLocation ?? DEFAULT_USER_LOCATION);
  const [hasLocation, setHasLocation] = useState<boolean>(savedLocation !== null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('locating');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(getOfflineQueueCount());
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);

  // Keep the id, not a copy, so an open sheet shows live votes and recommendations.
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [publishPreset, setPublishPreset] = useState<PublishPreset | null>(null);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMuralOpen, setIsMuralOpen] = useState<boolean>(false);
  const [isPushOpen, setIsPushOpen] = useState<boolean>(false);
  const [isBatterySaver, setIsBatterySaver] = useState<boolean>(false);
  // On the web's first visit the door comes first; the tutorial follows the choice.
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    return !localStorage.getItem('icaro_ayllu_tutorial_seen') && (IS_NATIVE || Boolean(localStorage.getItem(WEB_DOOR_KEY)));
  });
  const [isWebMember, setIsWebMember] = useState<boolean>(false);
  const [isSignedOut, setIsSignedOut] = useState<boolean>(() => IS_NATIVE && wasSignedOut());
  // A signed-out app opens on the way back in; it can be closed to only look.
  const [isAccessOpen, setIsAccessOpen] = useState<boolean>(() => IS_NATIVE && wasSignedOut());
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const canWrite = IS_NATIVE ? !isSignedOut : isWebMember;

  useEffect(() => {
    if (IS_NATIVE) return;
    supabase.auth.getSession().then(({ data }) => {
      const isMember = isWebMemberSession(data.session);
      setIsWebMember(isMember);
      if (!isMember && !localStorage.getItem(WEB_DOOR_KEY)) setIsAccessOpen(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setIsWebMember(isWebMemberSession(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const openAccess = useCallback((reason?: string) => {
    setAccessReason(reason ?? null);
    setIsAccessOpen(true);
  }, []);

  const closeAccess = useCallback((choice?: 'viewer' | 'member') => {
    setIsAccessOpen(false);
    setAccessReason(null);
    if (!choice || localStorage.getItem(WEB_DOOR_KEY)) return;
    try {
      localStorage.setItem(WEB_DOOR_KEY, choice);
    } catch {
      // the door shows again next visit, which is harmless
    }
    if (!localStorage.getItem('icaro_ayllu_tutorial_seen')) setIsTutorialOpen(true);
  }, []);

  const latestFetch = useRef(0);
  const isFlushingQueue = useRef(false);

  const clearNotice = useCallback(() => setNotice(null), []);
  const showNotice = useCallback((message: string) => setNotice(message), []);

  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    setIsAlertsOpen(false);
    setIsNewsOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const openServices = useCallback((filter: ServicesFilter = {}) => {
    setServicesFilter(filter);
    setTab('services');
  }, [setTab]);

  const openPublish = useCallback((preset?: PublishPreset) => {
    if (!canWrite) {
      openAccess(tr('Para publicar necesitas entrar con tu código de usuario.'));
      return;
    }
    setPublishPreset(preset ?? null);
    setIsPublishOpen(true);
  }, [canWrite, openAccess]);
  const closePublish = useCallback(() => setIsPublishOpen(false), []);

  const openReport = useCallback((kind: ReportKind) => {
    if (!canWrite) {
      openAccess(tr('Para avisar a tus vecinos necesitas entrar con tu código de usuario.'));
      return;
    }
    setReportKind(kind);
  }, [canWrite, openAccess]);
  const closeReport = useCallback(() => setReportKind(null), []);
  const refreshReports = useCallback(() => setReportsVersion((version) => version + 1), []);

  const openItem = useCallback((id: string) => setSelectedItemId(id), []);
  const closeItem = useCallback(() => setSelectedItemId(null), []);

  const refreshItems = useCallback(async () => {
    const fetchId = ++latestFetch.current;
    try {
      const remoteItems = await fetchNearbyPosts(userLocation.lat, userLocation.lng);
      // A slower, older response must not overwrite a newer one.
      if (fetchId === latestFetch.current) setItems(withPendingPosts(remoteItems));
    } catch (err) {
      console.warn('No se pudieron actualizar las publicaciones:', err);
    } finally {
      if (fetchId === latestFetch.current) setIsLoadingItems(false);
    }
  }, [userLocation.lat, userLocation.lng]);

  const signOut = useCallback(async () => {
    await signOutOfApp();
    setIsSignedOut(true);
    refreshItems(); // "mine" marks belong to the account that just left
  }, [refreshItems]);

  const finishSignIn = useCallback(() => {
    setIsSignedOut(false);
    setIsAccessOpen(false);
    setAccessReason(null);
    fetchUserCode().catch(() => {});
    refreshItems();
  }, [refreshItems]);

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
          setNotice(tr('No se pudo publicar "{title}". Revisa los datos y vuelve a intentar.', { title }));
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

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('icaro_ayllu_mode', newMode);
    setTab(newMode === 'emergency' ? EMERGENCY_HOME : NORMAL_HOME);
  }, [setTab]);

  const applyPosition = useCallback((lat: number, lng: number, accuracy?: number) => {
    if (!isInPeru(lat, lng)) {
      setLocationStatus('unavailable');
      setNotice(tr('Estás fuera del Perú. Elige un departamento en Alertas.'));
      return;
    }

    setHasLocation(true);
    setLocationStatus('ready');
    setUserLocation((current) => {
      const next = { lat, lng, accuracy, name: current.name === DEFAULT_USER_LOCATION.name ? LOCATED_NAME : current.name };
      saveLastLocation(next);
      return next;
    });

    // The name is only a nicety: the position must not wait for it, or for a connection.
    reverseGeocode(lat, lng).then((name) => {
      setUserLocation((current) => {
        if (current.lat !== lat || current.lng !== lng) return current;
        const next = { ...current, name };
        saveLastLocation(next);
        return next;
      });
    });
  }, []);

  const requestCurrentGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('locating');
    const onFix = (position: GeolocationPosition) => {
      applyPosition(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
    };
    const onFail = (error: GeolocationPositionError) => {
      console.warn('Ubicación no disponible:', error.message);
      setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
    };

    // Satellite GPS often times out indoors. The network position is plenty to find a
    // department, so fall back to it instead of silently staying on the default point.
    navigator.geolocation.getCurrentPosition(
      onFix,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          onFail(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(onFix, onFail, {
          enableHighAccuracy: false,
          timeout: 15_000,
          maximumAge: 600_000
        });
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 }
    );
  }, [applyPosition]);

  // The home screen describes the neighbour's own area, so locate them as soon as it opens.
  useEffect(() => {
    requestCurrentGPS();
  }, [requestCurrentGPS]);

  // In the installed app every neighbour gets a code from the first launch (unless they signed out:
  // then they come back with their number). On the web it is created only when someone asks for it,
  // so passing visitors do not become accounts.
  useEffect(() => {
    if (IS_NATIVE && !wasSignedOut()) fetchUserCode().catch(() => {});
  }, []);

  // A free call asked for without signal leaves as soon as the phone is back online.
  useEffect(() => {
    if (!isOnline) return;
    const waiting = queuedCall();
    if (!waiting) return;
    clearQueuedCall();
    const place = hasLocation ? { lat: userLocation.lat, lng: userLocation.lng, name: userLocation.name } : null;
    requestCall(waiting.destination, place)
      .then((result) => setNotice(result.status === 'ok'
        ? tr('Volvió la señal: pedimos tu llamada gratis. Tu celular sonará en unos segundos.')
        : tr('No se pudo hacer tu llamada guardada. Ábrela otra vez en SOS.')))
      .catch(() => queueCall(waiting.destination));
  }, [isOnline]);

  // The database enforces both rules too; checking here gives the neighbour a clear reason.
  const canRecommend = (item: CommunityItem | undefined): item is CommunityItem => {
    if (!item) return false;
    if (!canWrite) {
      openAccess(tr('Para recomendar o comentar necesitas entrar con tu código de usuario.'));
      return false;
    }
    if (item.isMine) {
      setNotice(tr('No puedes recomendar tu propia publicación.'));
      return false;
    }
    if (!navigator.onLine) {
      setNotice(tr('Necesitas internet para recomendar.'));
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
    tapFeedback();
    applyVote(id, voted);

    setVote(id, voted).catch((err) => {
      console.error('No se pudo guardar el voto:', err);
      applyVote(id, !voted);
      setNotice(tr('No se guardó tu Visto Bueno. Vuelve a intentar.'));
    });
  };

  const addReview = async (itemId: string, comment: string, reviewerName: string) => {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!canRecommend(item)) return;

    const authorName = reviewerName || ANONYMOUS_REVIEWER;
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
      setNotice(tr('No se guardó tu recomendación. Vuelve a intentar.'));
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
    tapFeedback();
    setNotice(navigator.onLine ? tr('Publicado') : tr('Guardado. Se publicará cuando vuelva internet.'));

    await flushOfflineQueue();
    if (navigator.onLine) await refreshItems();
  };

  const updateItemStatus = (id: string, status: CommunityItem['status']) => {
    const previousStatus = items.find((item) => item.id === id)?.status;
    if (!previousStatus) return;
    if (!canWrite) {
      openAccess(tr('Para cambiar tu publicación necesitas entrar con tu código de usuario.'));
      return;
    }

    if (!navigator.onLine) {
      setNotice(tr('Necesitas internet para avisar a tus vecinos.'));
      return;
    }

    const applyStatus = (nextStatus: CommunityItem['status']) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    };

    tapFeedback();
    applyStatus(status);
    setPostStatus(id, status).catch((err) => {
      console.error('No se pudo cambiar el estado:', err);
      applyStatus(previousStatus);
      setNotice(tr('No se pudo avisar. Vuelve a intentar.'));
    });
  };

  const itemsWithDistance = useMemo(() => {
    return items.map((item) => ({
      ...item,
      // Without a real position any distance would be invented.
      distanceMeters: hasLocation
        ? calculateDistanceMeters(userLocation.lat, userLocation.lng, item.coordinates[0], item.coordinates[1])
        : undefined
    }));
  }, [items, userLocation, hasLocation]);

  const selectedItem = useMemo(
    () => itemsWithDistance.find((item) => item.id === selectedItemId) ?? null,
    [itemsWithDistance, selectedItemId]
  );

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        tab,
        setTab,
        homeTab,
        isAlertsOpen,
        setIsAlertsOpen,
        isNewsOpen,
        setIsNewsOpen,
        reportKind,
        newsDetail,
        openNewsDetail,
        closeNewsDetail,
        openReport,
        closeReport,
        reportsVersion,
        refreshReports,
        servicesFilter,
        openServices,
        items: itemsWithDistance,
        userLocation,
        hasLocation,
        locationStatus,
        requestCurrentGPS,
        isOnline,
        pendingOfflineCount,
        isLoadingItems,
        selectedItem,
        openItem,
        closeItem,
        isPublishOpen,
        publishPreset,
        openPublish,
        closePublish,
        isSosOpen,
        setIsSosOpen,
        isTutorialOpen,
        setIsTutorialOpen,
        isMenuOpen,
        setIsMenuOpen,
        isMuralOpen,
        setIsMuralOpen,
        isPushOpen,
        setIsPushOpen,
        isBatterySaver,
        setIsBatterySaver,
        toggleVistoBueno,
        addReview,
        addItem,
        updateItemStatus,
        canWrite,
        isWebMember,
        isSignedOut,
        signOut,
        finishSignIn,
        isAccessOpen,
        accessReason,
        openAccess,
        closeAccess,
        notice,
        showNotice,
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
