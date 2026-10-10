/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      /** Request-scoped Supabase client; set by the middleware on `/admin` routes. */
      supabase?: SupabaseClient;
      /** Verified user (from `auth.getUser()`); set on `/admin` routes. */
      user?: User | null;
    }
  }
}
