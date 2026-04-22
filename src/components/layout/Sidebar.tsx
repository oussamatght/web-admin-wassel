"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { apiGet, apiPost } from "@/lib/api";
import { getInitials, getRoleLabel } from "@/lib/utils";
import { useSocketInvalidate } from "@/hooks/useSocket";
import { Badge } from "@/components/ui/badge";
import { WasslaLogo } from "@/components/common/WasslaLogo";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ShoppingCart,
  AlertTriangle,
  Wrench,
  Route,
  ShieldAlert,
  DollarSign,
  Tag,
  Bell,
  LogOut,
  Settings,
  UserCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  badgeKey?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Vue générale",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        href: "/dashboard/users",
        icon: Users,
        label: "Utilisateurs",
        badgeKey: "pendingUsers",
      },
      {
        href: "/dashboard/drivers",
        icon: Truck,
        label: "Livreurs",
      },
      {
        href: "/dashboard/prestataires",
        icon: UserCheck,
        label: "Prestataires",
      },
      {
        href: "/dashboard/products",
        icon: Package,
        label: "Produits",
        badgeKey: "pendingProducts",
      },
      {
        href: "/dashboard/orders",
        icon: ShoppingCart,
        label: "Commandes",
        badgeKey: "pendingOrders",
      },
      {
        href: "/dashboard/live-orders",
        icon: Route,
        label: "Suivi en direct",
      },
      {
        href: "/dashboard/live-map",
        icon: Route,
        label: "Live map",
      },
      {
        href: "/dashboard/fraud-alerts",
        icon: ShieldAlert,
        label: "Fraud detection",
      },
      {
        href: "/dashboard/disputes",
        icon: AlertTriangle,
        label: "Litiges",
        badgeKey: "openDisputes",
      },
      { href: "/dashboard/services", icon: Wrench, label: "Services" },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/dashboard/financials",
        icon: DollarSign,
        label: "Finances",
        badgeKey: "pendingWithdrawals",
      },
      { href: "/dashboard/promo-codes", icon: Tag, label: "Codes Promo" },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
      { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: badges } = useQuery({
    queryKey: ["sidebar-badges"],
    queryFn: () =>
      apiGet<Record<string, number>>("/admin/dashboard").catch(() => ({})),
    refetchInterval: 60000,
  });

  // Re-fetch badge counts when real-time events arrive
  useSocketInvalidate("newOrder", [["sidebar-badges"]]);
  useSocketInvalidate("orderStatusUpdate", [["sidebar-badges"]]);
  useSocketInvalidate("newDispute", [["sidebar-badges"]]);
  useSocketInvalidate("disputeUpdate", [["sidebar-badges"]]);
  useSocketInvalidate("newUser", [["sidebar-badges"]]);
  useSocketInvalidate("withdrawalRequest", [["sidebar-badges"]]);

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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="flex w-64 flex-col bg-[#1E3A5F] text-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6">
        <WasslaLogo size={40} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">WASSLA</span>
            <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 text-xs font-bold text-white">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badgeCount =
                  item.badgeKey && badges
                    ? (badges as Record<string, number>)[item.badgeKey]
                    : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-r-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-l-2 border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]"
                        : "border-l-2 border-transparent hover:bg-white/5"
                    }`}>
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <Badge className="bg-[#FF6B00] text-white text-xs font-bold px-1.5 py-0 min-w-5 text-center hover:bg-[#FF6B00]">
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card */}
      {user && (
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B00] text-sm font-bold text-white">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400">
                {getRoleLabel(user.role)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400"
              title="Déconnexion">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
