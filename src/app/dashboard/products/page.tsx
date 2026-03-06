"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDA, timeAgo, getCategoryLabel } from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  CheckCircle,
  XCircle,
  Package,
  RotateCcw,
  Eye,
} from "lucide-react";
import type { Product } from "@/types";

const CATEGORIES = [
  { value: "", label: "Toutes les catégories" },
  { value: "moteur", label: "Moteur" },
  { value: "mecatronique", label: "Mécatronique" },
  { value: "electronique", label: "Électronique" },
  { value: "freinage", label: "Freinage" },
  { value: "suspension", label: "Suspension" },
  { value: "transmission", label: "Transmission" },
  { value: "pneumatique", label: "Pneumatique" },
  { value: "electrique", label: "Électrique" },
  { value: "carrosserie", label: "Carrosserie" },
  { value: "interieur", label: "Intérieur" },
  { value: "echappement", label: "Échappement" },
  { value: "refroidissement", label: "Refroidissement" },
  { value: "filtres", label: "Filtres" },
  { value: "accessoires", label: "Accessoires" },
  { value: "autre", label: "Autre" },
];

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    category: "",
    isApproved: "",
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
      "admin-products",
      filters.category,
      filters.isApproved,
      debouncedSearch,
      filters.page,
    ],
    queryFn: () =>
      apiGet<ProductsResponse>("/admin/products", {
        params: {
          category: filters.category || undefined,
          isApproved:
            filters.isApproved !== "" ? filters.isApproved : undefined,
          search: debouncedSearch || undefined,
          page: filters.page,
          limit: 20,
        },
      }),
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPatch("/admin/products/" + id + "/approve"),
    onSuccess: () => {
      toast.success("Produit approuvé");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      refetch();
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch("/admin/products/" + id + "/toggle-status", { isActive }),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const hasFilters =
    filters.category || filters.isApproved !== "" || filters.search;
  const resetFilters = () =>
    setFilters({ category: "", isApproved: "", search: "", page: 1 });

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Produit",
      cell: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0]?.url ? (
            <img
              src={p.images[0].url}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0D1B2A] truncate max-w-50">
              {p.title}
            </p>
            <p className="text-xs text-slate-400">
              {p.seller?.firstName} {p.seller?.lastName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Catégorie",
      cell: (p) => (
        <Badge variant="outline" className="text-xs">
          {getCategoryLabel(p.category)}
        </Badge>
      ),
    },
    {
      key: "condition",
      header: "État",
      cell: (p) => (
        <Badge
          variant="outline"
          className={
            p.condition === "neuf"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }>
          {p.condition === "neuf" ? "Neuf" : "Occasion"}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Prix",
      cell: (p) => (
        <span className="text-sm font-medium text-[#FF6B00]">
          {formatDA(p.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (p) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              p.stock === 0
                ? "bg-red-500"
                : p.stock <= 5
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          />
          <span className="text-sm text-slate-600">{p.stock}</span>
        </div>
      ),
    },
    {
      key: "approved",
      header: "Approuvé",
      cell: (p) =>
        p.isApproved ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-slate-300" />
        ),
    },
    {
      key: "isActive",
      header: "Actif",
      cell: (p) => (
        <Switch
          checked={p.isActive}
          onCheckedChange={(val) =>
            toggleMutation.mutate({ id: p._id, isActive: val })
          }
        />
      ),
    },
    {
      key: "createdAt",
      header: "Ajouté",
      cell: (p) => (
        <span className="text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!p.isApproved && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Approuver ce produit ?",
                    description:
                      '"' + p.title + '" sera visible par les acheteurs.',
                    variant: "default",
                    onConfirm: async () => {
                      await approveMutation.mutateAsync(p._id);
                    },
                  })
                }>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />{" "}
                Approuver
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  title: "Désactiver ce produit ?",
                  description: '"' + p.title + '" ne sera plus visible.',
                  variant: "danger",
                  onConfirm: async () => {
                    await toggleMutation.mutateAsync({
                      id: p._id,
                      isActive: false,
                    });
                  },
                })
              }>
              <XCircle className="mr-2 h-4 w-4" /> Désactiver
            </DropdownMenuItem>
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
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Produits</h1>
        <p className="text-sm text-slate-500">
          {pagination?.total ?? 0} produit
          {(pagination?.total ?? 0) > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par titre..."
            className="pl-10 h-10"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))
            }
          />
        </div>

        <Select
          value={filters.category}
          onValueChange={(v) =>
            setFilters((p) => ({
              ...p,
              category: v === "all" ? "" : v,
              page: 1,
            }))
          }>
          <SelectTrigger className="w-52 h-10">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value || "all"} value={c.value || "all"}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.isApproved}
          onValueChange={(v) =>
            setFilters((p) => ({
              ...p,
              isApproved: v === "all" ? "" : v,
              page: 1,
            }))
          }>
          <SelectTrigger className="w-44 h-10">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="true">Approuvé</SelectItem>
            <SelectItem value="false">Non approuvé</SelectItem>
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="Aucun produit trouvé"
        emptyIcon={Package}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
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
