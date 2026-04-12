"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDA, timeAgo, getInitials } from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Truck,
} from "lucide-react";
import type { User } from "@/types";

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "pending_verification", label: "En attente vérif." },
  { value: "suspended", label: "Suspendu" },
  { value: "banned", label: "Banni" },
];

interface DriversResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export default function DriversPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
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
      "admin-drivers",
      filters.accountStatus,
      debouncedSearch,
      filters.page,
    ],
    queryFn: () =>
      apiGet<DriversResponse>("/admin/users", {
        params: {
          role: "driver",
          accountStatus: filters.accountStatus || undefined,
          search: debouncedSearch || undefined,
          page: filters.page,
          limit: 20,
        },
      }),
  });

  const drivers = data?.users ?? [];
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
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiPatch("/admin/users/" + id + "/verify"),
    onSuccess: () => {
      toast.success("Livreur vérifié");
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refetch();
    },
    onError: () => toast.error("Erreur de vérification"),
  });

  const hasFilters = filters.accountStatus || filters.search;
  const resetFilters = () =>
    setFilters({ accountStatus: "", search: "", page: 1 });

  const columns: Column<User>[] = [
    {
      key: "driver",
      header: "Livreur",
      cell: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar?.url ? (
            <img
              src={u.avatar.url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
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
        u.rating?.count > 0 ? (
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
                    title: "Vérifier ce livreur ?",
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
                    description: "Le compte du livreur sera réactivé.",
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
                      "Le livreur ne pourra plus accéder temporairement à la plateforme.",
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
                    description: "Attention : action irréversible.",
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
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Livreurs</h1>
        <p className="text-sm text-slate-500">
          {pagination?.total ?? 0} livreur
          {(pagination?.total ?? 0) > 1 ? "s" : ""} au total
        </p>
      </div>

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
          value={filters.accountStatus}
          onValueChange={(v) =>
            setFilters((p) => ({
              ...p,
              accountStatus: v === "all" ? "" : v,
              page: 1,
            }))
          }>
          <SelectTrigger className="w-52 h-10">
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

      <DataTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        emptyMessage="Aucun livreur trouvé"
        emptyIcon={Truck}
      />

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
        />
      )}

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
