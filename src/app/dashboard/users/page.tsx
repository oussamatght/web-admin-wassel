"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  formatDA,
  timeAgo,
  getInitials,
  getRoleLabel,
  getRoleColor,
} from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Pause,
  Ban,
  RotateCcw,
  Star,
  Users,
} from "lucide-react";
import type { User } from "@/types";

const ROLES = [
  { value: "", label: "Tous les rôles" },
  { value: "client", label: "Client" },
  { value: "seller", label: "Vendeur" },
  { value: "driver", label: "Livreur" },
  { value: "prestataire", label: "Prestataire" },
];

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "pending_verification", label: "En attente vérif." },
  { value: "suspended", label: "Suspendu" },
  { value: "banned", label: "Banni" },
];

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialRole = searchParams.get("role") ?? "";
  const [filters, setFilters] = useState({
    role: initialRole,
    accountStatus: "",
    search: "",
    page: 1,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "default";
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: async () => {},
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "admin-users",
      filters.role,
      filters.accountStatus,
      debouncedSearch,
      filters.page,
    ],
    queryFn: () =>
      apiGet<UsersResponse>("/admin/users", {
        params: {
          role: filters.role || undefined,
          accountStatus: filters.accountStatus || undefined,
          search: debouncedSearch || undefined,
          page: filters.page,
          limit: 20,
        },
      }),
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      accountStatus,
      reason,
    }: {
      id: string;
      accountStatus: string;
      reason?: string;
    }) => apiPatch("/admin/users/" + id + "/status", { accountStatus, reason }),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiPatch("/admin/users/" + id + "/verify"),
    onSuccess: () => {
      toast.success("Utilisateur vérifié");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refetch();
    },
    onError: () => toast.error("Erreur de vérification"),
  });

  const hasFilters = filters.role || filters.accountStatus || filters.search;
  const resetFilters = () =>
    setFilters({ role: "", accountStatus: "", search: "", page: 1 });

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "Utilisateur",
      cell: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar?.url ? (
            <img
              src={u.avatar.url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                u.role === "seller"
                  ? "bg-orange-500"
                  : u.role === "driver"
                    ? "bg-teal-500"
                    : u.role === "prestataire"
                      ? "bg-purple-500"
                      : "bg-blue-500"
              }`}>
              {getInitials(u.firstName, u.lastName)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#0D1B2A]">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-slate-400">{u.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "wilaya",
      header: "Wilaya",
      cell: (u) => <span className="text-sm text-slate-600">{u.wilaya}</span>,
    },
    {
      key: "role",
      header: "Rôle",
      cell: (u) => (
        <Badge
          variant="outline"
          className={getRoleColor(u.role) + " font-medium text-xs"}>
          {getRoleLabel(u.role)}
        </Badge>
      ),
    },
    {
      key: "accountStatus",
      header: "Statut",
      cell: (u) => <StatusBadge status={u.accountStatus} type="account" />,
    },
    {
      key: "wallet",
      header: "Solde",
      cell: (u) => (
        <span className="text-sm font-medium text-[#FF6B00]">
          {formatDA(u.wallet ?? 0)}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Évaluation",
      cell: (u) =>
        (u.role === "seller" || u.role === "driver") && u.rating?.count > 0 ? (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {u.rating.average.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({u.rating.count})</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Inscrit",
      cell: (u) => (
        <span className="text-xs text-slate-400">{timeAgo(u.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/users/" + u._id)}>
              <Eye className="mr-2 h-4 w-4" /> Voir détails
            </DropdownMenuItem>
            {u.accountStatus === "pending_verification" && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Vérifier cet utilisateur ?",
                    description:
                      u.firstName +
                      " " +
                      u.lastName +
                      " sera marqué comme vérifié.",
                    variant: "default",
                    onConfirm: async () => {
                      await verifyMutation.mutateAsync(u._id);
                    },
                  })
                }>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Vérifier
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {u.accountStatus !== "active" && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Activer ce compte ?",
                    description:
                      "Le compte de " +
                      u.firstName +
                      " " +
                      u.lastName +
                      " sera réactivé.",
                    variant: "default",
                    onConfirm: async () => {
                      await statusMutation.mutateAsync({
                        id: u._id,
                        accountStatus: "active",
                      });
                    },
                  })
                }>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Activer
              </DropdownMenuItem>
            )}
            {u.accountStatus !== "suspended" && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Suspendre ce compte ?",
                    description:
                      u.firstName +
                      " " +
                      u.lastName +
                      " ne pourra plus accéder à la plateforme temporairement.",
                    variant: "warning",
                    onConfirm: async () => {
                      await statusMutation.mutateAsync({
                        id: u._id,
                        accountStatus: "suspended",
                      });
                    },
                  })
                }>
                <Pause className="mr-2 h-4 w-4 text-orange-500" /> Suspendre
              </DropdownMenuItem>
            )}
            {u.accountStatus !== "banned" && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Bannir ce compte ?",
                    description:
                      "Attention : " +
                      u.firstName +
                      " " +
                      u.lastName +
                      " sera définitivement banni de la plateforme.",
                    variant: "danger",
                    onConfirm: async () => {
                      await statusMutation.mutateAsync({
                        id: u._id,
                        accountStatus: "banned",
                      });
                    },
                  })
                }>
                <Ban className="mr-2 h-4 w-4" /> Bannir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: "50px",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Utilisateurs</h1>
        <p className="text-sm text-slate-500">
          {pagination?.total ?? 0} utilisateur
          {(pagination?.total ?? 0) > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, téléphone..."
            className="pl-10 h-10"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))
            }
          />
        </div>

        <Select
          value={filters.role}
          onValueChange={(v) =>
            setFilters((p) => ({ ...p, role: v === "all" ? "" : v, page: 1 }))
          }>
          <SelectTrigger className="w-44 h-10">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value || "all"} value={r.value || "all"}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.accountStatus}
          onValueChange={(v) =>
            setFilters((p) => ({
              ...p,
              accountStatus: v === "all" ? "" : v,
              page: 1,
            }))
          }>
          <SelectTrigger className="w-48 h-10">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all"}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-slate-500">
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ value: "", label: "Tous" }, ...ROLES.slice(1)].map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              setFilters((p) => ({ ...p, role: tab.value, page: 1 }))
            }
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filters.role === tab.value
                ? "text-[#FF6B00] border-[#FF6B00]"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="Aucun utilisateur trouvé"
        emptyIcon={Users}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
