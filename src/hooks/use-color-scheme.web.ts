import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * useSyncExternalStore keeps the server snapshot at 'light' (matching SSR output)
 * and re-reads the real scheme on the client after hydration — without calling
 * setState inside an effect (which the React Compiler lint rules forbid).
 */
const emptySubscribe = () => () => {};

export function useColorScheme() {
  const colorScheme = useRNColorScheme();

  return useSyncExternalStore(
    emptySubscribe,
    () => colorScheme ?? 'light',
    () => 'light' as const,
  );
}
