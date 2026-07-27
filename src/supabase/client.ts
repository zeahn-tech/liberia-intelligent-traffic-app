import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Try Vite env vars first, then fall back to values from Freebuff Keys/API keys tab
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://yleytyqcrivnohpijtdp.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4HWhY7qDet1CuyRHT5wTmA_XeHe1QsS";

let _supabase: SupabaseClient | null = null;
let _initError: string | null = null;

/**
 * Attempt to create the real Supabase client.
 * If env vars are missing, we create a mock instead so the app
 * never crashes on module load — the Landing page works fine.
 */
try {
  if (supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "x-application-name": "trafficwatch-ai",
        },
      },
    });
  } else {
    _initError = "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.";
  }
} catch (e) {
  _initError = `Supabase initialization failed: ${e instanceof Error ? e.message : "Unknown error"}`;
}

/**
 * Builds a mock Supabase client that logs a warning on each call
 * instead of crashing the app. All methods return empty/error responses.
 */
function createMockClient(): SupabaseClient {
  const warn = (method: string) =>
    console.warn(`[Supabase] ${method}() skipped — ${_initError}`);

  const errResult = () => ({
    data: null,
    error: _initError ? new Error(_initError) : null,
  });

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    single: () => errResult(),
    maybeSingle: () => errResult(),
    then: undefined,
    catch: undefined,
    finally: undefined,
  };

  const mockFrom = (table: string) => {
    warn(`from("${table}")`);
    return mockQuery;
  };

  return {
    from: mockFrom,
    schema: () => ({ from: mockFrom }),
    rpc: (fn: string) => {
      warn(`rpc("${fn}")`);
      return mockQuery;
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => errResult(),
      signUp: async () => errResult(),
      signOut: async () => {},
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      resetPasswordForEmail: async () => errResult(),
      updateUser: async () => errResult(),
      setSession: async () => errResult(),
      refreshSession: async () => errResult(),
      _initialize: async () => {},
    },
    storage: {
      from: () => ({
        upload: async () => errResult(),
        download: async () => errResult(),
        list: async () => errResult(),
        remove: async () => errResult(),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    functions: {
      invoke: async () => errResult(),
    },
    channel: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    channels: () => [],
    removeChannel: () => {},
    removeAllChannels: () => {},
    getChannels: () => [],
    realtime: {} as any,
    rest: {} as any,
  } as unknown as SupabaseClient;
}

/**
 * The exported supabase client.
 * - If env vars are set and valid: the real Supabase client.
 * - Otherwise: a mock that logs warnings instead of crashing.
 */
export const supabase: SupabaseClient = _supabase ?? createMockClient();

/**
 * Check whether Supabase was configured successfully.
 */
export function isSupabaseConfigured(): boolean {
  return !!_supabase;
}

/**
 * Get the initialization error message, if any.
 */
export function getSupabaseInitError(): string | null {
  return _initError;
}
