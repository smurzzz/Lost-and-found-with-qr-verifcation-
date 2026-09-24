/**
 * Supabase Storage upload helper (item photos).
 *
 * Uploads a local image (from expo-image-picker) into the public
 * `item-photos` bucket under the signed-in user's folder and returns the
 * public URL to store in items.photo_url / lost_reports.photo_url.
 */

import { supabase } from '@/lib/supabase';
import { getSupabaseAccessToken } from '@/lib/token';

export class StorageError extends Error {}

function guessMimeType(uri: string): string {
  const clean = uri.split('?')[0] ?? '';
  if (/\.png$/i.test(clean)) return 'image/png';
  if (/\.webp$/i.test(clean)) return 'image/webp';
  if (/\.heic$/i.test(clean)) return 'image/heic';
  return 'image/jpeg';
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    default:
      return 'jpg';
  }
}

/**
 * Upload a picked image and return its public URL.
 * Reads the file with fetch() (works on web + Expo Go), then uploads via the
 * storage SDK. The object path is namespaced by the caller's Clerk sub so the
 * bucket RLS ("first folder = auth.jwt()->>'sub'") accepts it.
 */
export async function uploadItemPhoto(input: {
  localUri: string;
  userId: string;
}): Promise<string> {
  if (!supabase) {
    throw new StorageError('Supabase is not configured.');
  }

  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new StorageError('Your session has ended. Please sign in again.');
  }

  let bytes: ArrayBuffer;
  try {
    const response = await fetch(input.localUri);
    bytes = await response.arrayBuffer();
  } catch {
    throw new StorageError('Could not read the picked image.');
  }

  const mimeType = guessMimeType(input.localUri);
  const path = `${input.userId}/${Date.now()}.${extensionFor(mimeType)}`;

  const { error } = await supabase.storage
    .from('item-photos')
    .upload(path, bytes, { contentType: mimeType, upsert: false });

  if (error) {
    throw new StorageError(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('item-photos').getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new StorageError('Upload succeeded but the public URL is missing.');
  }
  return data.publicUrl;
}
