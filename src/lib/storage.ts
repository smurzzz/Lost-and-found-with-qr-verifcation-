/**
 * Supabase Storage upload helper (item photos).
 *
 * Uploads a local image (from expo-image-picker) into the public
 * `item-photos` bucket under the signed-in user's folder and returns the
 * public URL to store in items.photo_url / lost_reports.photo_url.
 *
 * Reading the file: React Native's fetch() silently returns an empty body
 * for content:// URIs, so on native we read base64 via expo-file-system's
 * legacy API and decode to bytes; on web we fetch() the blob URL normally.
 */

import { Buffer } from 'buffer';
import { Platform } from 'react-native';

import * as FileSystem from 'expo-file-system/legacy';

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

async function readImageBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Upload a picked image and return its public URL. The object path is
 * namespaced by the caller's Clerk sub so the bucket RLS ("first folder =
 * auth.jwt()->>'sub'") accepts it.
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

  let bytes: Uint8Array;
  try {
    bytes = await readImageBytes(input.localUri);
  } catch {
    throw new StorageError('Could not read the picked image.');
  }
  if (bytes.byteLength < 1000) {
    throw new StorageError('The picked image looks empty — please retake or reselect the photo.');
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
