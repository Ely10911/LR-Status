import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: false,
  },
});

/** Extracts the error message from a Supabase query result, if any. */
function queryErrorMessage(result: unknown): string {
  if (result && typeof result === "object" && "error" in result) {
    const err = (result as { error: unknown }).error;
    if (err && typeof err === "object" && "message" in err) {
      const message = (err as { message: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return "";
}

/**
 * Runs a Supabase query, retrying automatically when the network itself
 * fails ("TypeError: Failed to fetch") — e.g. a momentary connectivity drop
 * while the page loads. Genuine API errors are returned as-is.
 */
export async function withNetworkRetry<T>(
  run: () => PromiseLike<T>,
  attempts = 3,
): Promise<T> {
  let last: T | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    last = await run();
    const message = queryErrorMessage(last);
    const isNetworkFailure =
      message.includes("Failed to fetch") || message.includes("fetch failed");
    if (!isNetworkFailure || attempt === attempts) break;
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
  }
  return last as T;
}
