"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, User, LogOut } from "lucide-react";

const pathLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  products: "Produits",
  orders: "Commandes",
  disputes: "Litiges",
  services: "Services",
  financials: "Finances",
  "promo-codes": "Codes Promo",
  notifications: "Notifications",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiPost("/auth/logout");
    } catch {
      // ignore
    } finally {
      document.cookie = "accessToken=; path=/; max-age=0";
      logout();
      router.push("/login");
    }
  };

  // Build breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment) => ({
    label:
      pathLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
    segment,
  }));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.segment} className="flex items-center">
            {i > 0 && <span className="mx-2 text-slate-300">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "font-semibold text-[#0D1B2A]"
                  : "text-slate-500"
              }>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-slate-700"
          onClick={() => console.log("Search palette")}>
          <Search className="h-4.5 w-4.5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-slate-700"
          onClick={() => router.push("/dashboard/notifications")}>
          <Bell className="h-4.5 w-4.5" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* User Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B00] text-sm font-bold text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
                {getInitials(user.firstName, user.lastName)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
