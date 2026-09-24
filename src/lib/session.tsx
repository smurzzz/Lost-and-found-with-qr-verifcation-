/**
 * Session context (Phase 3): wraps Clerk (Google sign-in via the Clerk
 * instance) + the users-table role. Provides { isLoaded, isSignedIn, user,
 * dbUser, role, refresh, signOut }.
 *
 * Identity lives in Clerk (ClerkProvider above). We sync the Clerk user.id into
 * the Supabase `users` table using the Clerk `supabase` JWT template
 * (authBridge) — that's what makes Supabase RLS treat the caller as
 * `authenticated`, whose `sub` = Clerk user id = users.id.
 *
 * Demo mode: when EXPO_PUBLIC_* keys are not configured, `SessionProvider`
 * falls back to a local demo identity (no Clerk — its hooks would throw
 * without a provider) so the whole app stays clickable, routed through the
 * same session API.
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
import { useAuth, useUser } from '@clerk/expo';

import { applyClerkSupabaseToken, decodeJwtClaims } from '@/lib/authBridge';
import { getEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { syncUserOnLogin, type Profile } from '@/lib/sync-user';
import { getSupabaseAccessToken } from '@/lib/token';
import type { UserRow, UserRole } from '@/lib/db';

export interface SessionState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: Profile | null;
  /** The synced users row (null in demo mode / before sync). */
  dbUser: UserRow | null;
  /** Effective role driving routing and nav. */
  role: UserRole | null;
  /** Sync/RLS failure message (e.g. staff-not-provisioned) — shown on login. */
  syncError: string | null;
  /** Demo mode is active (no EXPO_PUBLIC_* keys) — identity is local-only. */
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

function SessionProviderShell({ children, value }: { children: ReactNode; value: SessionState }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * No EXPO_PUBLIC_* keys — serve the Phase 1 demo identities. Mounted WITHOUT a
 * ClerkProvider, so this path must not call any Clerk hook.
 */
function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [demoRole, setDemoRoleState] = useState<'student' | 'staff'>('student');

  const setDemoRole = useCallback((role: 'student' | 'staff') => {
    setDemoRoleState(role);
  }, []);

  const signOut = useCallback(async () => {
    setDemoRoleState('student');
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      isLoaded: true,
      isSignedIn: true, // demo mode is always "signed in"
      user: {
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
    }),
    [demoRole, setDemoRole, signOut],
  );

  return <SessionProviderShell value={value}>{children}</SessionProviderShell>;
}

/** Real auth — must be mounted inside a ClerkProvider. */
function ClerkSessionProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut: clerkSignOut } = useAuth();
  const [dbUser, setDbUser] = useState<UserRow | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Build the app-facing Profile from the Clerk user.
  const user = useMemo<Profile | null>(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      name:
        clerkUser.fullName ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        'ClaimIt user',
      email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    };
  }, [clerkUser]);

  /** Surface a sync failure; appends a diagnosis if the JWT lacks the role claim. */
  const reportSyncError = useCallback(async (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    // If the applied token's `role` claim isn't `authenticated`, PostgREST
    // treats us as anon and the insert fails RLS — surface that diagnosis.
    const token = await getSupabaseAccessToken().catch(() => null);
    const claims = token ? decodeJwtClaims(token) : null;
    const hint =
      claims && claims.role !== 'authenticated'
        ? ` (the Clerk \`supabase\` template must set role=authenticated; token role=${claims.role})`
        : '';
    setSyncError(`Sign-in sync failed — ${detail}${hint}`);
    setDbUser(null);
  }, []);

  /** Apply the Clerk `supabase` template token, then sync the users row. */
  const runSync = useCallback(async () => {
    if (!user) throw new Error('No session user.');
    const token = await applyClerkSupabaseToken(getToken);
    if (!token) {
      throw new Error('no Supabase JWT — Clerk template "supabase" is missing or getToken failed');
    }
    // Verify the bridge token BEFORE touching the DB, so a bad template is
    // reported as such instead of surfacing as a generic RLS violation.
    const claims = decodeJwtClaims(token);
    if (!claims?.sub || claims.role !== 'authenticated') {
      throw new Error(
        `Clerk JWT claims unexpected (sub=${claims?.sub ?? 'none'}, role=${claims?.role ?? 'none'}) — the template must set role=authenticated`,
      );
    }
    const row = await syncUserOnLogin(user);
    setSyncError(null);
    setDbUser(row);
  }, [getToken, user]);

  // Keep Supabase's client session in sync with the Clerk session and sync the
  // users row. All setState happens after awaits inside runSync / reportSyncError
  // (never synchronously in effect-body scope); the disable documents that.
  useEffect(() => {
    if (!supabase || !clerkLoaded || !clerkSignedIn) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSync().catch((error) => {
      if (!cancelled) void reportSyncError(error);
    });
    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkSignedIn, reportSyncError, runSync]);

  const refresh = useCallback(async () => {
    try {
      await runSync();
    } catch (error) {
      await reportSyncError(error);
    }
  }, [reportSyncError, runSync]);

  const signOut = useCallback(async () => {
    // End the Clerk session first, then drop the bridged Supabase session.
    await clerkSignOut();
    await supabase?.auth.signOut().catch(() => undefined);
    setDbUser(null);
    setSyncError(null);
  }, [clerkSignOut]);

  const value = useMemo<SessionState>(
    () => ({
      isLoaded: clerkLoaded ?? true,
      isSignedIn: clerkSignedIn ?? false,
      user,
      dbUser: syncError ? null : dbUser,
      role: dbUser?.role ?? null,
      syncError,
      isDemo: false,
      refresh,
      signOut,
    }),
    [clerkLoaded, clerkSignedIn, dbUser, refresh, signOut, syncError, user],
  );

  return <SessionProviderShell value={value}>{children}</SessionProviderShell>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = getEnv().isConfigured && supabase !== null;
  if (!configured) {
    return <DemoSessionProvider>{children}</DemoSessionProvider>;
  }
  return <ClerkSessionProvider>{children}</ClerkSessionProvider>;
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
