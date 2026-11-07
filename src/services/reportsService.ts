/** Neighbour news with a photo or video. The server decides what becomes public. */

import { Activity, Car, Flame, Mountain, TriangleAlert, Waves, type LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MediaOutcome } from './mediaCheck';
import { ensureSession } from './postsService';

export type ReportKind = 'accidente' | 'huaico' | 'inundacion' | 'sismo' | 'incendio' | 'otro';

export const REPORT_KINDS: { id: ReportKind; label: string; icon: LucideIcon }[] = [
  { id: 'accidente', label: 'Accidente', icon: Car },
  { id: 'huaico', label: 'Huaico', icon: Mountain },
  { id: 'inundacion', label: 'Inundación', icon: Waves },
  { id: 'incendio', label: 'Incendio', icon: Flame },
  { id: 'sismo', label: 'Sismo', icon: Activity },
  { id: 'otro', label: 'Otro', icon: TriangleAlert }
];

/** How a report is named on screen: "Huaico", or simply "Aviso" for anything else. */
export function reportTitle(kind: ReportKind): string {
  return kind === 'otro' ? 'Aviso' : REPORT_KINDS.find((option) => option.id === kind)?.label ?? 'Aviso';
}

export interface Report {
  id: string;
  kind: ReportKind;
  description: string;
  author_name: string;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  department: string;
  province: string;
  district: string;
  status: 'review' | 'published';
  created_at: string;
  is_mine: boolean;
  has_flagged: boolean;
}

export interface ReportPlace {
  department: string;
  province: string;
  district: string;
  lat: number;
  lng: number;
}

export interface NewReport {
  kind: ReportKind;
  description: string;
  authorName: string;
  place: ReportPlace;
  file: File | null;
  mediaOutcome: MediaOutcome | null;
}

export type ReportResult =
  | { status: 'published' | 'review' }
  | { status: 'rejected'; reason: 'advertising' | 'too_many' };

export interface PlaceFilter {
  department?: string | null;
  province?: string | null;
  district?: string | null;
}

export function mediaUrl(path: string): string {
  return supabase.storage.from('reports').getPublicUrl(path).data.publicUrl;
}

function extensionOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || file.type.split('/')[1] || 'bin';
}

export async function fetchReports(filter: PlaceFilter, limit = 30): Promise<Report[]> {
  const { data, error } = await supabase.rpc('reports_feed', {
    p_department: filter.department ?? null,
    p_province: filter.province ?? null,
    p_district: filter.district ?? null,
    p_limit: limit
  });
  if (error) throw error;
  return data as Report[];
}

export async function submitReport(report: NewReport): Promise<ReportResult> {
  await ensureSession();
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error('Sin sesión');

  let mediaPath: string | null = null;
  if (report.file) {
    mediaPath = `${userId}/${crypto.randomUUID()}.${extensionOf(report.file)}`;
    const { error } = await supabase.storage
      .from('reports')
      .upload(mediaPath, report.file, { contentType: report.file.type });
    if (error) throw error;
  }

  const { data, error } = await supabase.rpc('create_report', {
    p_kind: report.kind,
    p_description: report.description,
    p_author_name: report.authorName,
    p_department: report.place.department,
    p_province: report.place.province,
    p_district: report.place.district,
    p_lat: report.place.lat,
    p_lng: report.place.lng,
    p_media_path: mediaPath,
    p_media_type: report.file ? (report.file.type.startsWith('video/') ? 'video' : 'image') : null,
    p_media_check: report.mediaOutcome
  });
  if (error) throw error;

  const result = data as ReportResult;
  // A rejected report must not leave its file behind.
  if (result.status === 'rejected' && mediaPath) {
    await supabase.storage.from('reports').remove([mediaPath]);
  }
  return result;
}

export async function flagReport(reportId: string): Promise<void> {
  await ensureSession();
  const { error } = await supabase.rpc('flag_report', { p_report_id: reportId });
  if (error) throw error;
}

/** Calls onChange when a report appears or changes. Returns the unsubscribe function. */
export function subscribeToReports(onChange: () => void): () => void {
  const channel = supabase
    .channel(`reports-feed-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
