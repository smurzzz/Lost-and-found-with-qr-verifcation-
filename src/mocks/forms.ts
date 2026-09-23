import type { ItemCategory } from '@/mocks/items';

/** Category options for report forms — superset of feed chips. */
export const reportCategories = [
  'Wallets & purses',
  'Electronics',
  'Bags & backpacks',
  'Clothing',
  'IDs & cards',
  'Keys',
  'Other',
] as const satisfies readonly string[];

export type ReportCategory = (typeof reportCategories)[number];

/** Simple date choices for the Phase 1 mock form (real picker in Phase 5). */
export const reportDateOptions = [
  'Today',
  'Yesterday',
  '2 days ago',
  '3 days ago',
  'A week ago',
] as const;

export function categoryFromItemCategory(category: ItemCategory): ReportCategory {
  switch (category) {
    case 'Bags':
      return 'Bags & backpacks';
    case 'IDs':
      return 'IDs & cards';
    case 'Keys':
      return 'Keys';
    case 'Wallets':
      return 'Wallets & purses';
    default:
      return category;
  }
}

/** Maps a mock date choice to a concrete label for mocks/fixtures. */
export function formatDateChoice(choice: string): string {
  const now = new Date();
  const days = { Today: 0, Yesterday: 1, '2 days ago': 2, '3 days ago': 3, 'A week ago': 7 };
  const offset = days[choice as keyof typeof days] ?? 0;
  now.setDate(now.getDate() - offset);
  return now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
