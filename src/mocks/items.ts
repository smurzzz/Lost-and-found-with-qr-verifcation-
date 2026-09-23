/**
 * Phase 1 mock data fixtures (08-PHASE-PLAN.md §1.1).
 * Every Phase 1 screen reads from these instead of the real API.
 * Shapes mirror the DB schema in 02-ARCHITECTURE.md §3, camelCased at the
 * boundary per 03-CODE-STANDARDS.md §3.
 */

import bagImage from '@/assets/items/bag.avif';
import keysImage from '@/assets/items/keys.avif';
import walletImage from '@/assets/items/wallet.avif';

export type ItemCategory = 'Electronics' | 'Bags' | 'Clothing' | 'IDs' | 'Wallets' | 'Keys';

export type MockItem = {
  id: string;
  title: string;
  category: ItemCategory;
  location: string;
  foundDate: string;
  foundTime: string;
  photo: number | null;
  /** pending_dropoff items stay visible with the pending badge (09 §2). */
  status: 'available' | 'pending_dropoff';
  source: 'staff_logged' | 'student_reported';
};

export const mockFoundItems: MockItem[] = [
  {
    id: 'item-1',
    title: 'Blue canvas backpack',
    category: 'Bags',
    location: 'Library front desk',
    foundDate: 'May 21',
    foundTime: '1:20 PM',
    photo: bagImage,
    status: 'available',
    source: 'staff_logged',
  },
  {
    id: 'item-2',
    title: 'Car keys with leather keychain',
    category: 'Keys',
    location: 'Cafeteria',
    foundDate: 'May 21',
    foundTime: '10:35 AM',
    photo: keysImage,
    status: 'available',
    source: 'staff_logged',
  },
  {
    id: 'item-3',
    title: 'Brown leather wallet',
    category: 'Wallets',
    location: 'Room 204',
    foundDate: 'May 20',
    foundTime: '3:15 PM',
    photo: walletImage,
    status: 'available',
    source: 'staff_logged',
  },
  {
    id: 'item-4',
    title: 'Student ID card',
    category: 'IDs',
    location: 'Gym entrance',
    foundDate: 'May 20',
    foundTime: '8:02 AM',
    photo: null,
    status: 'pending_dropoff',
    source: 'student_reported',
  },
  {
    id: 'item-5',
    title: 'Black wireless headphones',
    category: 'Electronics',
    location: 'Study hall B',
    foundDate: 'May 19',
    foundTime: '4:40 PM',
    photo: null,
    status: 'available',
    source: 'staff_logged',
  },
];

export const itemCategories: readonly (ItemCategory | 'All')[] = [
  'All',
  'Electronics',
  'Bags',
  'Clothing',
  'IDs',
] as const;
