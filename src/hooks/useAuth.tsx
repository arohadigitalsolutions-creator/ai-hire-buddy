import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Set loading false immediately - don't block on role fetch
        setLoading(false);

        if (newSession?.user) {
          // Fetch role in background without blocking
          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", newSession.user.id)
                .maybeSingle();
              setUserRole(data?.role ?? "user");
            } catch {
              setUserRole("user");
            }
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    if (!initializedRef.current) {
      initializedRef.current = true;
      supabase.auth.getSession().then(({ data: { session: initSession } }) => {
        if (!initSession) {
          setLoading(false);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
