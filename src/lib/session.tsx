/**
 * Session context (Phase 3): wraps Clerk auth + the users-table role.
 * Provides { isLoaded, isSignedIn, clerkUser, dbUser, role, refresh, signOut }.
 *
 * Demo mode: when Clerk keys are not configured (pre-task-0.4), the provider
 * falls back to a local demo identity so the whole app stays clickable —
 * the same behavior Phase 1 shipped, now routed through the single session
 * API so screens don't branch on configuration.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth, useClerk, useUser as useClerkUser } from '@clerk/expo';

import type { UserRow, UserRole } from '@/lib/db';
import {
  applyClerkSupabaseToken,
  getClerkSupabaseToken,
  registerTokenSupplier,
} from '@/lib/authBridge';
import { getEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { syncUserOnLogin } from '@/lib/sync-user';

export interface SessionState {
  /** Clerk data settled (or demo mode ready). */
  isLoaded: boolean;
  isSignedIn: boolean;
  clerkUser: { id: string; name: string; email: string } | null;
  /** The synced users row (null in demo mode / before sync). */
  dbUser: UserRow | null;
  /** Effective role driving routing and nav. */
  role: UserRole | null;
  /** Sync/RLS failure message (e.g. staff-not-provisioned) — shown on login. */
  syncError: string | null;
  /** Demo mode is active (no Clerk keys) — identity is local-only. */
  isDemo: boolean;
  /** In demo mode: switch the local identity. */
  setDemoRole?: (role: 'student' | 'staff') => void;
  /** Re-run the users-table sync (after profile edits). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

const DEMO_USERS: Record<'student' | 'staff', UserRow> = {
  student: {
    id: '00000000-0000-4000-8000-000000000001',
    role: 'student',
    name: 'Alex Morgan',
    email: 'alex.morgan@school.edu',
    class_or_dept: 'Class 10B',
    push_token: null,
    created_at: new Date().toISOString(),
  },
  staff: {
    id: '00000000-0000-4000-8000-000000000002',
    role: 'staff',
    name: 'Maya Chen',
    email: 'maya.chen@school.edu',
    class_or_dept: 'Front Desk',
    push_token: null,
    created_at: new Date().toISOString(),
  },
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const env = getEnv();
  const clerkConfigured = Boolean(env.clerkPublishableKey) && supabase !== null;
  const { isLoaded: clerkLoaded, isSignedIn, signOut: clerkSignOut, getToken } = useAuth();
  const { user: clerkUserRaw } = useClerkUser();
  const clerk = useClerk();

  const [demoRole, setDemoRoleState] = useState<'student' | 'staff'>('student');
  const [dbUser, setDbUser] = useState<UserRow | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const clerkProfile = useMemo(() => {
    if (!clerkUserRaw) return null;
    const primary = clerkUserRaw.primaryEmailAddress?.emailAddress ?? '';
    const firstName = clerkUserRaw.firstName ?? '';
    const lastName = clerkUserRaw.lastName ?? '';
    const fullName =
      clerkUserRaw.fullName ?? (firstName || lastName ? `${firstName} ${lastName}`.trim() : '');
    return {
      id: clerkUserRaw.id,
      name: fullName || 'ClaimIt user',
      email: primary,
    };
  }, [clerkUserRaw]);

  // Register the live Clerk token supplier so authBridge can stamp Supabase
  // requests with the Clerk session JWT (RLS sees auth.uid() = the Clerk user).
  useEffect(() => {
    registerTokenSupplier(
      clerkConfigured && isSignedIn && getToken
        ? async () => {
            const token = await getToken();
            return token ?? null;
          }
        : null,
    );
  }, [clerkConfigured, getToken, isSignedIn]);

  const sync = useCallback(async () => {
    try {
      // No setState before the first await (react-hooks/set-state-in-effect).
      const token = await getClerkSupabaseToken();
      await applyClerkSupabaseToken(token);
      if (!clerkProfile) {
        setDbUser(null);
        return;
      }
      setSyncError(null);
      const row = await syncUserOnLogin(clerkProfile);
      setDbUser(row);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sign-in sync failed.');
      setDbUser(null);
    }
  }, [clerkProfile]);

  useEffect(() => {
    if (!clerkConfigured) return;
    if (clerkLoaded && isSignedIn) {
      // sync() is inherently async; its setStates run only in the fulfillment
      // path after token fetch/apply, never synchronously in this effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void sync();
    } else if (clerkLoaded) {
      setDbUser(null);
    }
  }, [clerkConfigured, clerkLoaded, isSignedIn, sync]);

  const setDemoRole = useCallback((role: 'student' | 'staff') => {
    setDemoRoleState(role);
    setDbUser(DEMO_USERS[role]);
  }, []);

  const signOut = useCallback(async () => {
    if (clerkConfigured && isSignedIn) {
      await clerkSignOut();
    }
    // Clear the Supabase auth header so the next person starts anon.
    await applyClerkSupabaseToken(null);
    registerTokenSupplier(null);
    setDbUser(null);
    setSyncError(null);
    setDemoRoleState('student');
    await clerk.signOut().catch(() => undefined);
  }, [clerk, clerkConfigured, clerkSignOut, isSignedIn]);

  const value = useMemo<SessionState>(() => {
    if (!clerkConfigured) {
      return {
        isLoaded: true,
        isSignedIn: true, // demo mode is always "signed in"
        clerkUser: {
          id: DEMO_USERS[demoRole].id,
          name: DEMO_USERS[demoRole].name,
          email: DEMO_USERS[demoRole].email,
        },
        dbUser: DEMO_USERS[demoRole],
        role: demoRole,
        syncError: null,
        isDemo: true,
        setDemoRole,
        refresh: async () => undefined,
        signOut,
      };
    }
    return {
      isLoaded: clerkLoaded,
      isSignedIn: Boolean(isSignedIn),
      clerkUser: clerkProfile,
      dbUser: syncError ? null : dbUser,
      role: dbUser?.role ?? null,
      syncError,
      isDemo: false,
      refresh: sync,
      signOut,
    };
  }, [
    clerkConfigured,
    clerkLoaded,
    clerkProfile,
    dbUser,
    demoRole,
    isSignedIn,
    setDemoRole,
    signOut,
    sync,
    syncError,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>.');
  }
  return ctx;
}

/** "Alex Morgan" → "AM"; falls back to "CA" (ClaimIt). Used for avatars. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CA';
  const initials = parts
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'CA';
}
