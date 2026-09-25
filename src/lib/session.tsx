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

import { decodeJwtClaims, setClerkTokenGetter } from '@/lib/authBridge';
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
  /** Effective role driving routing and nav (an explicit view switch wins;
   *  'admin' drives the staff UI). */
  role: UserRole | null;
  /** Real mode, staff/admin only: the role currently being previewed.
   *  Null = using the account's own role. Resets on sign-out / app restart. */
  viewRole: 'student' | 'staff' | null;
  /** Staff/admin only: switch which role's UI they are browsing. */
  setViewRole?: (role: 'student' | 'staff') => void;
  /** True when the profile "User view / Staff view" toggle should render. */
  canSwitchViews: boolean;
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
      viewRole: null,
      syncError: null,
      isDemo: true,
      canSwitchViews: true,
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
  // Staff view switch: which role's UI the user is browsing (staff/admin
  // only). Local session state only — the DB role never changes here.
  const [viewRole, setViewRole] = useState<'student' | 'staff' | null>(null);

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
      // Google accounts carry their profile photo through Clerk automatically.
      imageUrl: clerkUser.imageUrl,
    };
  }, [clerkUser]);

  /** Surface a sync failure; appends a diagnosis if the token lacks the role claim. */
  const reportSyncError = useCallback(async (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    // If the session token's `role` claim isn't `authenticated`, PostgREST
    // treats us as anon and the insert fails RLS — surface that diagnosis.
    const token = await getSupabaseAccessToken().catch(() => null);
    const claims = token ? decodeJwtClaims(token) : null;
    let hint =
      claims && claims.role !== 'authenticated'
        ? ` (session token lacks role=authenticated — add it in Clerk → Configure → Sessions → Customize session token; role=${claims.role})`
        : '';
    // Ask the DATABASE what it thinks of the request. If Supabase rejected
    // the token's SIGNATURE (Third-Party Auth not registered for the Clerk
    // domain), the claims look fine to us but the DB sees an anon caller —
    // this surfaces that gap definitively.
    if (supabase) {
      const { data: who } = await supabase.rpc('who_am_i').then(
        (res) => res,
        () => ({ data: null }),
      );
      const seen = who as { jwt_role?: string; sub?: string | null } | null;
      if (seen) {
        hint += ` [db sees: role=${seen.jwt_role ?? '?'}, sub=${seen.sub ?? 'null'}]`;
      } else {
        hint += ' [run supabase/who-am-i.sql to enable db-side diagnosis]';
      }
    }
    setSyncError(`Sign-in sync failed — ${detail}${hint}`);
    setDbUser(null);
  }, []);

  /** Register the token getter so every Supabase request carries a fresh
   *  Clerk session token (official third-party-auth wiring), then sync the
   *  users row. Throws with a precise message when claims are off — the
   *  role claim lives in Clerk → Configure → Sessions → Customize session
   *  token, NOT a JWT template. */
  const runSync = useCallback(async () => {
    if (!user) throw new Error('No session user.');
    const token = await getToken({}).catch(() => null);
    if (!token) {
      throw new Error('no Clerk session token available');
    }
    const claims = decodeJwtClaims(token);
    if (!claims?.sub || claims.role !== 'authenticated') {
      throw new Error(
        `session token missing claims (sub=${claims?.sub ?? 'none'}, role=${claims?.role ?? 'none'}) — add {"role":"authenticated"} in Clerk → Configure → Sessions → Customize session token`,
      );
    }
    const row = await syncUserOnLogin(user);
    setSyncError(null);
    setDbUser(row);
  }, [getToken, user]);

  // Keep the module-level token getter pointed at this session while signed
  // in; every Supabase request mints a fresh Clerk session token through it.
  useEffect(() => {
    if (!clerkLoaded || !clerkSignedIn) {
      setClerkTokenGetter(null);
      return;
    }
    setClerkTokenGetter(async (opts) => getToken(opts ?? {}));
    return () => setClerkTokenGetter(null);
  }, [clerkLoaded, clerkSignedIn, getToken]);

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
    setClerkTokenGetter(null);
    setDbUser(null);
    setSyncError(null);
    setViewRole(null);
  }, [clerkSignOut]);

  // The view switch is staff/admin-only; an explicit choice wins over the
  // account role, and 'admin' drives the staff UI.
  const isStaffAccount = dbUser?.role === 'staff' || dbUser?.role === 'admin';
  const effectiveRole: UserRole | null =
    viewRole ?? (dbUser?.role === 'admin' ? 'staff' : (dbUser?.role ?? null));

  const value = useMemo<SessionState>(
    () => ({
      isLoaded: clerkLoaded ?? true,
      isSignedIn: clerkSignedIn ?? false,
      user,
      dbUser: syncError ? null : dbUser,
      role: syncError ? null : effectiveRole,
      viewRole,
      setViewRole: isStaffAccount ? setViewRole : undefined,
      canSwitchViews: Boolean(isStaffAccount) && !syncError,
      syncError,
      isDemo: false,
      refresh,
      signOut,
    }),
    [
      clerkLoaded,
      clerkSignedIn,
      dbUser,
      effectiveRole,
      isStaffAccount,
      refresh,
      signOut,
      syncError,
      user,
      viewRole,
    ],
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

/** "Alex Morgan" → "AM" — moved to @/lib/utils (pure, unit-testable). */
export { initialsOf } from '@/lib/utils';
