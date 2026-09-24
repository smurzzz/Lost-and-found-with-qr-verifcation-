/**
 * Mock data — ported 1:1 from the Lovable source (claimit-app.tsx).
 * Item ids/names/photos/statuses match the new design's fixtures.
 */

import backpack from '@/assets/images/navy-backpack.jpg';
import bottle from '@/assets/images/green-bottle.jpg';
import headphones from '@/assets/images/white-headphones.jpg';
import wallet from '@/assets/images/wallet-keys.jpg';

export type ItemStatus = 'unclaimed' | 'dropoff' | 'pending' | 'released';

export type MockItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  date: string;
  image: number;
  status: ItemStatus;
  source: 'Logged by staff' | 'Reported by student';
};

export const items: MockItem[] = [
  {
    id: 'CI-2481',
    name: 'Navy backpack',
    category: 'Bags',
    location: 'North Library',
    date: 'Today, 9:40 AM',
    image: backpack,
    status: 'unclaimed',
    source: 'Logged by staff',
  },
  {
    id: 'CI-2479',
    name: 'White headphones',
    category: 'Electronics',
    location: 'Music Room',
    date: 'Today, 8:15 AM',
    image: headphones,
    status: 'pending',
    source: 'Logged by staff',
  },
  {
    id: 'CI-2476',
    name: 'Green water bottle',
    category: 'Other',
    location: 'West Gym',
    date: 'Yesterday',
    image: bottle,
    status: 'dropoff',
    source: 'Reported by student',
  },
  {
    id: 'CI-2471',
    name: 'Black wallet & keys',
    category: 'IDs/Cards',
    location: 'Science Hall',
    date: 'Sep 22',
    image: wallet,
    status: 'released',
    source: 'Logged by staff',
  },
];

export const statusCopy: Record<ItemStatus, string> = {
  unclaimed: 'Unclaimed',
  dropoff: 'Pending drop-off',
  pending: 'Pending claim',
  released: 'Released',
};

export const categories = ['All', 'Electronics', 'Bags', 'Clothing', 'IDs/Cards', 'Other'];

/** Student-report audit timeline (green water bottle) and staff-logged one. */
export const auditStepsStudent = ['Reported', 'Confirmed by Staff', 'Matched', 'Claim Requested'];
export const auditStepsStaff = ['Found', 'Matched', 'Claim Requested', 'Released'];

export const staffPendingClaims = [
  {
    name: 'Taylor R. · White headphones',
    detail: 'Small blue mark under left ear cup',
  },
  {
    name: 'Morgan L. · Navy backpack',
    detail: 'Initials written inside front pocket',
  },
];
