#!/usr/bin/env node
/**
 * ClaimIt — demo dataset seeder: 10 staff-logged found items + 10 lost
 * reports, each with a crisp 1080px photo.
 *
 * Photos are curated Unsplash product shots downloaded at 1080px (q=80) and
 * uploaded to the PUBLIC `item-photos` storage bucket under `demo/…`, so the
 * app's <Image> components render the exact stored asset (no hotlinking —
 * the URLs keep working offline of Unsplash).
 *
 * Requires the SERVICE-ROLE key (RLS doesn't apply to it, so this works
 * without any signed-in user). NEVER ship it to a client build.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-demo-images.mjs
 * or set SUPABASE_SERVICE_ROLE_KEY in .env first.
 *
 * Idempotent: every row has a fixed UUID and the upload uses upsert, so
 * re-running refreshes the same dataset (new photos replace old ones).
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

/** Minimal .env reader (KEY=VALUE lines, quotes stripped). */
function loadDotEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const pairs = text
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const eq = line.indexOf('=');
        return [
          line.slice(0, eq).trim(),
          line
            .slice(eq + 1)
            .trim()
            .replace(/^["']|["']$/g, ''),
        ];
      });
    return Object.fromEntries(pairs);
  } catch {
    return {};
  }
}

const envFile = loadDotEnv();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || envFile.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing config. Provide the service-role key and the project URL:\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=eyJ… node scripts/seed-demo-images.mjs\n' +
      '(URL comes from .env → EXPO_PUBLIC_SUPABASE_URL, or export it too.)\n' +
      'Find the key in Supabase Dashboard → Project Settings → API → service_role.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const BUCKET = 'item-photos';
const FOLDER = 'demo';
const PHOTO_PARAMS = 'w=1080&q=80&fm=jpg&fit=crop'; // crisp 1080px JPEG

const seenHashes = new Map(); // sha256 → object name (detect duplicate photos)

const storageUrl = (objectName) =>
  `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectName}`;

/* -------------------------------------------------------------------------- */
/* Fixed identity rows (same ids as supabase/migrations/…0001_phase2_seed)    */
/* -------------------------------------------------------------------------- */

const STUDENT_1 = '00000000-0000-4000-8000-000000000001'; // Alex Morgan
const STAFF_1 = '00000000-0000-4000-8000-000000000002'; // Maya Chen
const STUDENT_2 = '00000000-0000-4000-8000-000000000003'; // Taylor Roberts

const SEED_USERS = [
  {
    id: STUDENT_1,
    role: 'student',
    name: 'Alex Morgan',
    email: 'alex.morgan@school.edu',
    class_or_dept: 'Class 10B',
  },
  {
    id: STAFF_1,
    role: 'staff',
    name: 'Maya Chen',
    email: 'maya.chen@school.edu',
    class_or_dept: 'Front Desk',
  },
  {
    id: STUDENT_2,
    role: 'student',
    name: 'Taylor Roberts',
    email: 'taylor.roberts@school.edu',
    class_or_dept: 'Class 9A',
  },
];

/* -------------------------------------------------------------------------- */
/* Dataset — items (staff-logged) and lost reports                            */
/* `unsplash` values verified 200 OK before committing.                        */
/* -------------------------------------------------------------------------- */

const ITEMS = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Grey canvas backpack',
    category: 'Bags',
    description: 'Grey canvas backpack with padded 15" laptop sleeve and black zip pulls.',
    location: 'North Library',
    hoursAgo: 3,
    status: 'available',
    qr: 'FND-7X2B9',
    unsplash: '1553062407-98eeb64c6a62',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: 'White over-ear headphones',
    category: 'Electronics',
    description: 'White over-ear headphones, small blue mark under the left ear cup.',
    location: 'Music Room',
    hoursAgo: 6,
    status: 'pending_claim',
    qr: 'FND-3KQ81',
    unsplash: '1505740420928-5e560c06d30e',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: 'Green insulated bottle',
    category: 'Other',
    description: 'Matte green insulated bottle, sticker on the lid, 750ml.',
    location: 'West Gym',
    hoursAgo: 20,
    status: 'available',
    qr: 'FND-2KM74',
    unsplash: '1523362628745-0c100150b504',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    title: 'Black leather wallet',
    category: 'IDs/Cards',
    description: 'Black leather bifold wallet with keys attached, campus card inside.',
    location: 'Science Hall',
    hoursAgo: 48,
    status: 'claimed',
    qr: 'FND-9WM42',
    unsplash: '1602143407151-7111542de6e8',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    title: 'Navy blue umbrella',
    category: 'Other',
    description: 'Navy blue folding umbrella with a wooden handle.',
    location: 'East Entrance',
    hoursAgo: 30,
    status: 'available',
    qr: 'FND-5QR88',
    unsplash: '1627123424574-724758594e93',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    title: 'Silver wristwatch',
    category: 'Jewelry',
    description: 'Silver analog wristwatch with a mesh strap.',
    location: 'Cafeteria',
    hoursAgo: 10,
    status: 'available',
    qr: 'FND-4TP17',
    unsplash: '1523275335684-37898b6baf30',
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    title: 'Tortoise sunglasses',
    category: 'Other',
    description: 'Tortoiseshell-frame sunglasses in a black soft case.',
    location: 'Sports Field',
    hoursAgo: 26,
    status: 'available',
    qr: 'FND-6JD53',
    unsplash: '1572635196237-14b3f281503f',
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    title: 'Space-grey laptop',
    category: 'Electronics',
    description: '13-inch space-grey laptop, star sticker on the lid, sleep-mode.',
    location: 'Study Room 2B',
    hoursAgo: 5,
    status: 'available',
    qr: 'FND-8HC62',
    unsplash: '1496181133206-80ce9b88a853',
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    title: 'Scientific calculator',
    category: 'Electronics',
    description: 'Black scientific calculator, name tag "R. Alvarez" on the back.',
    location: 'Math Wing',
    hoursAgo: 15,
    status: 'available',
    qr: 'FND-1VN90',
    unsplash: '1556821840-3a63f95609a7',
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    title: 'Black leather gloves',
    category: 'Clothing',
    description: 'Pair of black leather gloves, size M, left in a lecture hall.',
    location: 'Lecture Hall A',
    hoursAgo: 55,
    status: 'available',
    qr: 'FND-0PB36',
    unsplash: '1620799140408-edc6dcb6d633',
  },
];

const REPORTS = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    category: 'Electronics',
    description: 'White over-ear headphones with a small blue mark under the left ear cup.',
    location: 'Student Center',
    daysAgo: 3,
    status: 'possible_match',
    reportedBy: STUDENT_1,
    unsplash: '1572569511254-d8f925fe2cbb',
    name: 'report-1.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    category: 'Jewelry',
    description: 'Silver wristwatch with a mesh strap, engraved clasp.',
    location: 'Cafeteria',
    daysAgo: 1,
    status: 'searching',
    reportedBy: STUDENT_2,
    unsplash: '1523275335684-37898b6baf30',
    name: 'report-2.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    category: 'Electronics',
    description: 'Scientific calculator, black, with a name tag on the back.',
    location: 'Math Wing',
    daysAgo: 2,
    status: 'searching',
    reportedBy: STUDENT_1,
    unsplash: '1556821840-3a63f95609a7',
    name: 'report-3.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    category: 'Clothing',
    description: 'Black leather gloves, size M, gone after the 10am lecture.',
    location: 'Lecture Hall A',
    daysAgo: 2,
    status: 'searching',
    reportedBy: STUDENT_2,
    unsplash: '1620799140408-edc6dcb6d633',
    name: 'report-4.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    category: 'Other',
    description: 'Tortoiseshell sunglasses in a black soft case.',
    location: 'Sports Field',
    daysAgo: 1,
    status: 'searching',
    reportedBy: STUDENT_1,
    unsplash: '1572635196237-14b3f281503f',
    name: 'report-5.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    category: 'Other',
    description: 'Navy folding umbrella with a wooden handle.',
    location: 'East Entrance',
    daysAgo: 1,
    status: 'searching',
    reportedBy: STUDENT_2,
    unsplash: '1627123424574-724758594e93',
    name: 'report-6.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    category: 'Electronics',
    description: 'White wireless earbuds in a charging case.',
    location: 'Library Garden',
    daysAgo: 4,
    status: 'searching',
    reportedBy: STUDENT_1,
    unsplash: '1572569511254-d8f925fe2cbb',
    name: 'report-7.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    category: 'Clothing',
    description: 'Red-and-white running sneakers, size 42.',
    location: 'Track Field',
    daysAgo: 5,
    status: 'searching',
    reportedBy: STUDENT_2,
    unsplash: '1542291026-7eec264c27ff',
    name: 'report-8.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    category: 'Other',
    description: 'A5 ruled notebook with a blue fabric cover and pen loop.',
    location: 'Chemistry Lab',
    daysAgo: 6,
    status: 'searching',
    reportedBy: STUDENT_1,
    unsplash: '1517842645767-c639042777db',
    name: 'report-9.jpg',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    category: 'Other',
    description: 'Set of three silver keys on a round keyring.',
    location: 'Main Gate',
    daysAgo: 2,
    status: 'searching',
    reportedBy: STUDENT_2,
    unsplash: '1600294037681-c80b4cb5b434',
    name: 'report-10.jpg',
  },
];

/* -------------------------------------------------------------------------- */
/* Upload helper                                                              */
/* -------------------------------------------------------------------------- */

/** Download the 1080px Unsplash photo and upsert it into item-photos/demo/. */
async function uploadPhoto(objectName, unsplashId) {
  const sourceUrl = `https://images.unsplash.com/photo-${unsplashId}?${PHOTO_PARAMS}`;
  const response = await fetch(sourceUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Unsplash returned ${response.status} for photo-${unsplashId}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 20_000) {
    // A real 1080px JPEG is never this small — guards against stub uploads.
    throw new Error(`photo-${unsplashId} downloaded suspiciously small (${bytes.length} bytes)`);
  }

  const hash = createHash('sha256').update(bytes).digest('hex');
  const duplicate = seenHashes.get(hash);
  if (duplicate) {
    throw new Error(`photo-${unsplashId} is byte-identical to ${duplicate} — dedupe the manifest`);
  }
  seenHashes.set(hash, objectName);

  const { error } = await supabase.storage.from(BUCKET).upload(`${FOLDER}/${objectName}`, bytes, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) {
    throw new Error(`upload ${FOLDER}/${objectName} failed: ${error.message}`);
  }
  return storageUrl(`${FOLDER}/${objectName}`);
}

/* -------------------------------------------------------------------------- */
/* Seed steps                                                                 */
/* -------------------------------------------------------------------------- */

async function seedUsers() {
  for (const user of SEED_USERS) {
    const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
    if (error) throw new Error(`upsert users/${user.email}: ${error.message}`);
  }
  // Real accounts (e.g. Henry) may also author lost reports — include them.
  const { data: extras, error } = await supabase
    .from('users')
    .select('id, role')
    .in('role', ['student', 'staff']);
  if (error) throw new Error(`read users: ${error.message}`);
  const writerIds = extras?.map((row) => row.id) ?? [];
  return writerIds.length > 0 ? writerIds : [STUDENT_1, STUDENT_2];
}

async function seedItems() {
  for (const [index, item] of ITEMS.entries()) {
    const photoUrl = await uploadPhoto(`item-${index + 1}.jpg`, item.unsplash);
    const hoursAgo = item.hoursAgo;
    const row = {
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      photo_url: photoUrl,
      found_location: item.location,
      found_date: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
      source: 'staff_logged',
      status: item.status,
      qr_code: item.qr,
      confirmed_by: STAFF_1,
      confirmed_at: new Date(Date.now() - Math.max(hoursAgo - 1, 0) * 3_600_000).toISOString(),
    };
    const { data, error } = await supabase
      .from('items')
      .upsert(row, { onConflict: 'id' })
      .select('id, title')
      .single();
    if (error) throw new Error(`upsert item "${item.title}": ${error.message}`);
    console.log(`  ✓ item ${index + 1}/10  ${data.title}`);
  }
}

async function seedReports(writerIds) {
  for (const [index, report] of REPORTS.entries()) {
    const photoUrl = await uploadPhoto(report.name, report.unsplash);
    const reportedBy = writerIds[index % writerIds.length];
    const row = {
      id: report.id,
      reported_by: reportedBy,
      category: report.category,
      description: report.description,
      lost_location: report.location,
      lost_date: new Date(Date.now() - report.daysAgo * 86_400_000).toISOString(),
      status: report.status,
      photo_url: photoUrl,
    };
    const { data, error } = await supabase
      .from('lost_reports')
      .upsert(row, { onConflict: 'id' })
      .select('id')
      .single();
    if (error) throw new Error(`upsert lost report ${report.id}: ${error.message}`);
    console.log(
      `  ✓ report ${index + 1}/10  (${data.id.slice(0, 8)}… by ${reportedBy.slice(0, 8)}…)`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

console.log(`Seeding ClaimIt demo data → ${supabaseUrl}`);
console.log(`  photos: ${PHOTO_PARAMS} JPEGs → ${BUCKET}/${FOLDER}/…`);

const writerIds = await seedUsers();
console.log(`  ${writerIds.length} authoring user(s) found (seed rows + any real accounts)`);

console.log('Uploading found-item photos and upserting items…');
await seedItems();

console.log('Uploading reference photos and upserting lost reports…');
await seedReports(writerIds);

console.log('\nDone: 10 staff-logged items + 10 lost reports, all with 1080px photos.');
console.log('Reload the app feed to see them.');
