/**
 * Photos of services and favours. They are made smaller on the phone before uploading (at most 1600 px,
 * JPEG): a neighbour on prepaid data should not spend 5 MB to show a cake.
 */
import { supabase } from '../lib/supabase';
import { ensureSession } from './postsService';

export const MAX_POST_PHOTOS = 4;
const MAX_SIDE = 1600;

export const postPhotoUrl = (path: string) => supabase.storage.from('post-photos').getPublicUrl(path).data.publicUrl;

async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Uploads one photo to the author's own folder and returns its path. */
export async function uploadPostPhoto(file: File): Promise<string> {
  await ensureSession();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('Sin sesión');
  const blob = await shrink(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('post-photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}
