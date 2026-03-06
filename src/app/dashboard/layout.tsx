"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //const router = useRouter();
  const { isLoading, isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF6B00]" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  //   if (!isAuthenticated) {
  //     router.push("/login");
  //     return null;
  //   }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D1B2A]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
