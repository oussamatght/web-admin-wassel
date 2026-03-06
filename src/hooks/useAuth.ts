"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook that redirects to /login if the user is not authenticated
 * or is not an admin. Returns the current user.
 */
export function useRequireAdmin() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return { user, isLoading, isAuthenticated };
}
