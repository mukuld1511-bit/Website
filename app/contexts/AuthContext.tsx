"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import type { UserRole } from "../../types/gallery";

interface AuthState {
  user:     User | null;
  userRole: UserRole;
  loading:  boolean;
  signOut:  () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:     null,
  userRole: "user",
  loading:  true,
  signOut:  async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setUserRole((snap.data().role as UserRole) ?? "user");
          }
        } catch (err) {
          console.error("Failed to fetch user role:", err);
        }
      } else {
        setUserRole("user");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserRole("user");
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
