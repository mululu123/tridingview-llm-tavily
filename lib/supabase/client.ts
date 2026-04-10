<<<<<<< HEAD
import { createBrowserClient } from '@supabase/ssr'
=======
import { createBrowserClient } from "@supabase/ssr";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
<<<<<<< HEAD
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
=======
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
