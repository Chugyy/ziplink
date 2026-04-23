"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  const logout = () => {
    clearToken();
    router.replace("/login");
  };

  return { loading, authenticated, logout };
}
