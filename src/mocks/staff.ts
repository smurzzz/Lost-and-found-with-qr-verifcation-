/**
 * Staff-flow mock fixtures (08-PHASE-PLAN.md §1.2).
 * Complements src/mocks/items.ts — these drive the staff dashboard tabs.
 * Shapes mirror the DB schema in 02-ARCHITECTURE.md §3, camelCased.
 */

export type MockStudentReport = {
  id: string;
  title: string;
  category: string;
  reporter: string;
  location: string;
  reportedAt: string;
  /** pending_dropoff → amber "Confirm Receipt"; qr_tag_ready → green "View QR Tag". */
  status: 'pending_dropoff' | 'qr_tag_ready';
  /** Links to a mockFoundItems entry once the physical item is confirmed. */
  itemId?: string;
};

export const mockStudentReports: MockStudentReport[] = [
  {
    id: 'report-1',
    title: 'Blue Water Bottle',
    category: 'Other',
    reporter: 'Alex Morgan',
    location: 'Gym entrance',
    reportedAt: 'Today, 9:20 AM',
    status: 'pending_dropoff',
  },
  {
    id: 'report-2',
    title: 'Canvas Backpack',
    category: 'Bags & backpacks',
    reporter: 'Jordan Lee',
    location: 'Library',
    reportedAt: 'Yesterday',
    status: 'qr_tag_ready',
    // The backpack the student dropped off is item-1 in src/mocks/items.ts.
    itemId: 'item-1',
  },
];

export type MockClaim = {
  id: string;
  itemTitle: string;
  claimant: string;
  detailPreview: string;
  claimedAt: string;
};

/** Verification questions students submitted on the Claim screen (06). */
export const mockPendingClaims: MockClaim[] = [
  {
    id: 'claim-1',
    itemTitle: 'Black Leather Wallet',
    claimant: 'Alex Morgan',
    detailPreview: 'A small photo of my dog is tucked behind the card slots.',
    claimedAt: 'Today, 8:47 AM',
  },
  {
    id: 'claim-2',
    itemTitle: 'Car Keys with Leather Keychain',
    claimant: 'Jordan Lee',
    detailPreview: 'The fob battery is dead and there is a gym locker tag on the ring.',
    claimedAt: 'Yesterday, 5:12 PM',
  },
];

/**
 * What a successful QR scan resolves to (screen 11's verified sheet).
 * Verification is the distinctive detail the claimant submitted on screen 06.
 */
export const mockScanResult = {
  tagId: 'CI-BKP001',
  title: 'Blue Canvas Backpack',
  claimant: 'Alex Morgan',
  verification: 'Red keychain on side pocket',
  status: 'Claimed' as const,
};

/** Timeline events for one item's history (screen 12). */
export type MockAuditEvent = {
  id: string;
  title: string;
  time: string;
  description: string;
  actor: string;
  tone: 'navy' | 'orange' | 'green';
  check?: boolean;
  /** Lifecycle stage for the filter pills (unclaimed → pending → claimed). */
  stage: 'unclaimed' | 'pending_claim' | 'claimed';
};

export const mockAuditEvents: MockAuditEvent[] = [
  {
    id: 'event-1',
    title: 'FOUND',
    time: 'May 21 · 1:20 PM',
    description: 'Item logged and tagged',
    actor: 'By Maya Chen',
    tone: 'navy',
    stage: 'unclaimed',
  },
  {
    id: 'event-2',
    title: 'MATCHED',
    time: 'May 23 · 9:10 AM',
    description: 'Possible match surfaced',
    actor: 'By ClaimIt',
    tone: 'orange',
    stage: 'pending_claim',
  },
  {
    id: 'event-3',
    title: 'CLAIM REQUESTED',
    time: 'May 23 · 9:18 AM',
    description: 'Claim submitted for review',
    actor: 'By Alex Morgan',
    tone: 'orange',
    stage: 'pending_claim',
  },
  {
    id: 'event-4',
    title: 'RELEASED',
    time: 'May 23 · 9:32 AM',
    description: 'QR scan confirmed handoff',
    actor: 'By Maya Chen',
    tone: 'green',
    check: true,
    stage: 'claimed',
  },
];
