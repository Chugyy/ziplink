"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUsername, setUsername, clearToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    // Fetch user info (includes username)
    api
      .me()
      .then((data) => {
        const u = data as User;
        setUser(u);
        setUsername(u.username);
        setAuthenticated(true);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = useCallback(() => {
    clearToken();
    router.replace("/login");
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    if (updates.username) {
      setUsername(updates.username);
    }
  }, []);

  return {
    loading,
    authenticated,
    user,
    username: user?.username || getUsername() || "",
    logout,
    updateUser,
  };
}
