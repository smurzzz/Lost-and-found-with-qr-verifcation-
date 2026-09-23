/**
 * QR tag id generation for found items (09 §8: every item gets a unique tag).
 * Phase 1: client-side mock. Phase 6 replaces with server-generated tags so
 * scanned codes resolve against the DB.
 */

/** Visible tag id printed on the physical sticker (mock format CI-XXXXXX). */
export function generateTagId(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no lookalikes
  let id = '';
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CI-${id}`;
}
