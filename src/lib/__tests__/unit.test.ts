/**
 * ClaimIt — unit tests. Pure logic + the api wrapper's error contract, with
 * globals mocked so nothing touches the network, the DB, or RN internals.
 *
 * Static imports (Jest CJS mode) — module-level state is controlled by
 * explicitly (re)setting the auth bridge's token getter, never resetModules.
 */

import { decodeJwtClaims, fetchSessionToken, setClerkTokenGetter } from '@/lib/authBridge';
import { initialsOf } from '@/lib/utils';
import { getSupabaseAccessToken } from '@/lib/token';
import { ApiError, confirmReceivedItem, logFoundItem, releaseItem } from '@/lib/api/items';
import { runMatching } from '@/lib/api/match';

/** Minimal base64url JWT factory for the authBridge tests. */
function makeJwt(claims: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

describe('lib/authBridge', () => {
  afterEach(() => {
    setClerkTokenGetter(null);
  });
  it('returns null when no token getter is registered (signed out)', async () => {
    await expect(fetchSessionToken()).resolves.toBeNull();
  });

  it('forwards to the registered getter and cleans up on null', async () => {
    const getter = jest.fn().mockResolvedValue('token-1');
    setClerkTokenGetter(getter);
    await expect(fetchSessionToken()).resolves.toBe('token-1');
    expect(getter).toHaveBeenCalledWith({});

    setClerkTokenGetter(null);
    await expect(fetchSessionToken()).resolves.toBeNull();
  });

  it('decodes base64url JWT payloads (sub / role / iss)', () => {
    const token = makeJwt({ sub: 'user_2abc', role: 'authenticated', iss: 'clerk' });
    expect(decodeJwtClaims(token)).toEqual({
      sub: 'user_2abc',
      role: 'authenticated',
      iss: 'clerk',
    });
  });

  it('returns null for malformed tokens instead of throwing', () => {
    expect(decodeJwtClaims('not-a-jwt')).toBeNull();
    expect(decodeJwtClaims('a.b.c')).toBeNull();
    expect(decodeJwtClaims('')).toBeNull();
  });
});

describe('lib/utils initialsOf', () => {
  it.each([
    ['Alex Morgan', 'AM'],
    ['maya chen', 'MC'],
    ['Cher', 'C'],
    ['  spaced   out  name ', 'SO'],
    ['', 'CA'],
    ['   ', 'CA'],
  ])('initialsOf(%j) → %j', (input, expected) => {
    expect(initialsOf(input)).toBe(expected);
  });
});

describe('lib/token getSupabaseAccessToken', () => {
  afterEach(() => {
    setClerkTokenGetter(null);
  });

  it('prefers the Clerk session token when one is registered', async () => {
    setClerkTokenGetter(jest.fn().mockResolvedValue('clerk-token'));
    await expect(getSupabaseAccessToken()).resolves.toBe('clerk-token');
  });

  it('returns null when no Clerk getter exists', async () => {
    await expect(getSupabaseAccessToken()).resolves.toBeNull();
  });
});

describe('lib/api error contract', () => {
  let fetchMock: jest.Mock;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://unit-test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_unit';
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    // Re-assert per test — other suites reset the bridge between describes.
    setClerkTokenGetter(jest.fn().mockResolvedValue('session-token'));
  });

  afterAll(() => {
    setClerkTokenGetter(null);
  });

  function jsonResponse(status: number, body: unknown) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  }

  it('logFoundItem posts to /log-found with the bearer token and returns the item', async () => {
    const item = { id: 'item-1', title: 'Grey canvas backpack' };
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, item }));

    const result = await logFoundItem({
      title: 'Grey canvas backpack',
      category: 'Bags',
      description: 'Test',
      found_location: 'Library',
    });

    expect(result).toEqual(item);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://unit-test.supabase.co/functions/v1/log-found');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer session-token');
  });

  it('surfaces structured function errors as ApiError with status + code', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { error: { code: 'confirm_conflict', message: 'Already confirmed.' } }),
    );

    await expect(confirmReceivedItem('item-1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'confirm_conflict',
      message: 'Already confirmed.',
    });
  });

  it('maps network failures to a friendly ApiError (status 0)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(
      releaseItem({ itemId: 'i', claimId: 'c', scannedQrCode: 'FND-1' }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 0, code: 'network' });
  });

  it('runMatching normalizes the snake_case payload', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, matches: 2, report_status: 'possible_match', notified: true }),
    );

    await expect(runMatching('report-1')).resolves.toEqual({
      matches: 2,
      reportStatus: 'possible_match',
      notified: true,
    });
  });

  it('runMatching treats a sparse payload as zero matches, not a crash', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await expect(runMatching('report-1')).resolves.toEqual({
      matches: 0,
      reportStatus: null,
      notified: false,
    });
  });

  it('exposes ApiError for instanceof checks in screens', () => {
    const error = new ApiError(403, 'forbidden', 'Only staff can do this.');
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(403);
    expect(error.code).toBe('forbidden');
  });

  it('throws unauthenticated before any fetch when the token is missing', async () => {
    setClerkTokenGetter(null);
    await expect(
      logFoundItem({ title: 'x', category: 'Bags', description: '', found_location: 'y' }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 401, code: 'unauthenticated' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
