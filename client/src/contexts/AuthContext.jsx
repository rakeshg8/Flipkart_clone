import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import api from "../api/http";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (currentUser) => {
    if (!currentUser?.id) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/me");
      const profile = response.data?.data;
      setUser({
        ...currentUser,
        role: profile?.role || "customer",
        full_name: profile?.full_name || currentUser.user_metadata?.full_name,
        avatar_url: profile?.avatar_url
      });
    } catch {
      setUser({ ...currentUser, role: "customer" });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 2000))
        ]);
        const nextSession = sessionResult?.data?.session || null;
        setSession(nextSession);
        setLoading(false);
        void syncProfile(nextSession?.user || null);
      } catch {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
      void syncProfile(nextSession?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signUp: (email, password, fullName) =>
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signInWithGoogle: () =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin
          }
        }),
      signOut: () => supabase.auth.signOut(),
      refreshProfile: async () => {
        const { data } = await supabase.auth.getSession();
        await syncProfile(data.session?.user || null);
      }
    }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
