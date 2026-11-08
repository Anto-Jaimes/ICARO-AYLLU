/**
 * Shared neighbourhood data in Supabase: posts, Visto Bueno votes and recommendations.
 * Neighbours never register: the first write creates an anonymous session for the device.
 * Authorship, counters and verification are enforced by the database, not here.
 */

import { supabase } from '../lib/supabase';
import { CommunityItem, PostType, Review } from '../types';
import { formatRelativeTime } from '../utils/time';

// Lists filter by distance on the client, so fetch the widest radius the server allows.
const FETCH_RADIUS_M = 50000;
const REFRESH_DEBOUNCE_MS = 400;
const UNIQUE_VIOLATION = '23505';

interface ReviewRow {
  id: string;
  author_name: string;
  comment: string;
  is_neighbor_verified: boolean;
  created_at: string;
}

interface PostRow {
  id: string;
  type: PostType;
  category: string;
  title: string;
  description: string;
  author_name: string;
  author_phone: string | null;
  neighborhood: string;
  address: string | null;
  lat: number;
  lng: number;
  price_info: string | null;
  urgency_level: CommunityItem['urgencyLevel'] | null;
  status: CommunityItem['status'];
  vistos_buenos: number;
  created_at: string;
  is_mine: boolean;
  has_user_voted: boolean;
  reviews: ReviewRow[];
  photos: string[] | null;
  audience: CommunityItem['audience'] | null;
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    authorName: row.author_name,
    comment: row.comment,
    date: formatRelativeTime(row.created_at),
    dateIso: row.created_at,
    isNeighborVerified: row.is_neighbor_verified
  };
}

function toCommunityItem(row: PostRow): CommunityItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category,
    authorName: row.author_name,
    authorPhone: row.author_phone ?? undefined,
    neighborhood: row.neighborhood,
    address: row.address ?? undefined,
    coordinates: [row.lat, row.lng],
    vistosBuenos: row.vistos_buenos,
    hasUserVoted: row.has_user_voted,
    isMine: row.is_mine,
    reviews: row.reviews.map(toReview),
    priceInfo: row.price_info ?? undefined,
    photos: row.photos ?? [],
    audience: row.audience ?? undefined,
    urgencyLevel: row.urgency_level ?? undefined,
    status: row.status,
    createdAt: formatRelativeTime(row.created_at),
    createdAtIso: row.created_at
  };
}

let pendingSession: Promise<void> | null = null;

// Shared promise: simultaneous first writes must not create two anonymous users.
export function ensureSession(): Promise<void> {
  pendingSession ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;

    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  })().finally(() => {
    pendingSession = null;
  });

  return pendingSession;
}

/**
 * Supabase creates only so many new anonymous users per internet connection and hour. Many people
 * on one Wi-Fi (a fair, a shelter) can reach it: "check your internet" would send them the wrong way.
 */
export const BUSY_NETWORK_MESSAGE = 'Muchas personas empezaron a usar AYLLU desde esta misma red. Espera unos minutos y vuelve a intentar.';

export function isBusyNetwork(error: unknown): boolean {
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  return status === 429 || code === 'over_request_rate_limit';
}

/**
 * True when the database refused the data, so retrying would fail again.
 * Postgres errors carry a 5-character SQLSTATE; connection failures do not.
 */
export function isRejectedByServer(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code);
}

export async function fetchNearbyPosts(lat: number, lng: number): Promise<CommunityItem[]> {
  const { data, error } = await supabase.rpc('nearby_posts', {
    p_lat: lat,
    p_lng: lng,
    p_radius_m: FETCH_RADIUS_M
  });
  if (error) throw error;

  return (data as PostRow[]).map(toCommunityItem);
}

/** Safe to retry: the id comes from the device, so a repeat is ignored instead of duplicated. */
export async function createPost(item: CommunityItem): Promise<void> {
  await ensureSession();

  const { error } = await supabase.from('posts').upsert(
    {
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      author_name: item.authorName,
      author_phone: item.authorPhone ?? null,
      neighborhood: item.neighborhood,
      address: item.address ?? null,
      lat: item.coordinates[0],
      lng: item.coordinates[1],
      price_info: item.priceInfo ?? null,
      urgency_level: item.urgencyLevel ?? null,
      photos: item.photos ?? [],
      audience: item.audience ?? null
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function setVote(postId: string, voted: boolean): Promise<void> {
  await ensureSession();

  if (voted) {
    const { error } = await supabase.from('post_votes').insert({ post_id: postId });
    if (error && error.code !== UNIQUE_VIOLATION) throw error;
    return;
  }

  const { error } = await supabase.from('post_votes').delete().eq('post_id', postId);
  if (error) throw error;
}

export async function submitReview(
  postId: string,
  authorName: string,
  comment: string,
  lat: number,
  lng: number
): Promise<void> {
  await ensureSession();

  const { error } = await supabase.rpc('add_review', {
    p_post_id: postId,
    p_author_name: authorName,
    p_comment: comment,
    p_lat: lat,
    p_lng: lng
  });
  if (error) throw error;
}

export async function setPostStatus(postId: string, status: CommunityItem['status']): Promise<void> {
  await ensureSession();

  const { data, error } = await supabase.from('posts').update({ status }).eq('id', postId).select('id');
  if (error) throw error;
  // A row blocked by RLS is not an error, it simply comes back empty.
  if (data.length === 0) throw new Error('No tienes permiso para cambiar este estado');
}

/** Calls onChange shortly after any neighbour changes something. Returns the unsubscribe function. */
export function subscribeToPostChanges(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, REFRESH_DEBOUNCE_MS);
  };

  // Unique topic: StrictMode remounts before the previous channel finishes closing.
  const channel = supabase
    .channel(`community-feed-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, scheduleRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, scheduleRefresh)
    .subscribe((status) => {
      // Covers whatever changed while the channel was connecting or reconnecting.
      if (status === 'SUBSCRIBED') scheduleRefresh();
    });

  return () => {
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}

export type FlagPostResult = 'ok' | 'no_code' | 'not_found' | 'own';

/** Reports a service or donation to the moderators. Needs the user code, like every other write. */
export async function flagPost(postId: string): Promise<FlagPostResult> {
  await ensureSession();
  const { data, error } = await supabase.rpc('flag_post', { p_post_id: postId });
  if (error) throw error;
  return data as FlagPostResult;
}
