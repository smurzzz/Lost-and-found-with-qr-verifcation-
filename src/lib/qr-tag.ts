/**
 * QR tag + claim id generation (09 §8: every item gets a unique tag).
 * Phase 1: client-side mocks. Phase 6 replaces with server-generated ids
 * so scanned codes resolve against the DB.
 *
 * Formats per the 2025-09 mockups:
 *  - Physical tag sticker / QR payload: `FND-7X2B9` (scan-to-release.webp)
 *  - Claim record id on the tag card:   `CLM-2051`   (qr-tag-ready.webp)
 */

const TAG_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no lookalikes

/** Physical tag id printed on the sticker (mock format FND-XXXXX). */
export function generateTagId(): string {
  let id = '';
  for (let i = 0; i < 5; i += 1) {
    id += TAG_ALPHABET[Math.floor(Math.random() * TAG_ALPHABET.length)];
  }
  return `FND-${id}`;
}

/** Claim record id shown on the QR tag card (mock format CLM-XXXX). */
export function generateClaimId(): string {
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `CLM-${n}`;
}
