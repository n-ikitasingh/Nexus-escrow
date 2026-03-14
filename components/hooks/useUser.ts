// PATH: hooks/useUser.ts
// Custom hook — import this wherever you need the current user + profile

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Profile {
  id:         string;
  full_name:  string | null;
  role:       "employer" | "freelancer";
  pfi:        number;       // matches profiles.pfi column in DB
  created_at: string;
}

export interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUser(): UseUserResult {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile whenever we have a user id
  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
      }
      setLoading(false);
    });

    // 2. Subscribe to auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          fetchProfile(u.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}