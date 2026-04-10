<<<<<<< HEAD
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()
=======
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
>>>>>>> origin/v0/zmpple-7535-fb84d16f

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
<<<<<<< HEAD
          return cookieStore.getAll()
=======
          return cookieStore.getAll();
>>>>>>> origin/v0/zmpple-7535-fb84d16f
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
<<<<<<< HEAD
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
=======
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
<<<<<<< HEAD
    },
  )
=======
    }
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
