"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { formatDA, formatDate } from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Percent,
  Hash,
} from "lucide-react";
import type { PromoCode } from "@/types";

interface PromoCodesResponse {
  promoCodes: PromoCode[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface PromoFormData {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  expiresAt: string;
  isActive: boolean;
}

const DEFAULT_FORM: PromoFormData = {
  code: "",
  discountType: "percent",
  discountValue: 10,
  minOrderAmount: 0,
  maxUses: 0,
  expiresAt: "",
  isActive: true,
};

export default function PromoCodesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promo-codes", page],
    queryFn: () =>
      apiGet<PromoCodesResponse>("/admin/promo-codes", {
        params: { page, limit: 20 },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: PromoFormData) => apiPost("/admin/promo-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      setSheetOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoFormData> }) =>
      apiPatch(`/admin/promo-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      setSheetOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      setDeleteId(null);
    },
  });

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setSheetOpen(true);
  }

  function openEdit(promo: PromoCode) {
    setEditingId(promo._id);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount ?? 0,
      maxUses: promo.maxUses ?? 0,
      expiresAt: promo.expiresAt
        ? new Date(promo.expiresAt).toISOString().slice(0, 10)
        : "",
      isActive: promo.isActive,
    });
    setSheetOpen(true);
  }

  function handleSubmit() {
    if (editingId) {
      const { code, ...rest } = form;
      updateMutation.mutate({ id: editingId, data: rest });
    } else {
      createMutation.mutate(form);
    }
  }

  const columns: Column<PromoCode>[] = [
    {
      key: "code",
      header: "Code",
      cell: (p) => (
        <span className="font-mono font-bold text-[#FF6B00]">{p.code}</span>
      ),
    },
    {
      key: "discountType",
      header: "Type",
      cell: (p) => (
        <Badge variant="outline">
          {p.discountType === "percent" ? (
            <>
              <Percent className="mr-1 h-3 w-3" />
              Pourcentage
            </>
          ) : (
            <>
              <Hash className="mr-1 h-3 w-3" />
              Fixe
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "discountValue",
      header: "Valeur",
      cell: (p) =>
        p.discountType === "percent"
          ? `${p.discountValue}%`
          : formatDA(p.discountValue),
    },
    {
      key: "usedCount",
      header: "Utilisations",
      cell: (p) => `${p.usedCount}${p.maxUses ? ` / ${p.maxUses}` : ""}`,
    },
    {
      key: "expiresAt",
      header: "Expiration",
      cell: (p) => (p.expiresAt ? formatDate(p.expiresAt) : "—"),
    },
    {
      key: "isActive",
      header: "Actif",
      cell: (p) => (
        <Badge
          variant="outline"
          className={
            p.isActive
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }>
          {p.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (p) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => setDeleteId(p._id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const promoCodes = data?.promoCodes ?? [];
  const pagination = data?.pagination;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Tag className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Codes Promo</h1>
            <p className="text-sm text-slate-500">
              {pagination?.total ?? 0} codes au total
            </p>
          </div>
        </div>
        <Button
          className="bg-[#FF6B00] hover:bg-[#e65e00]"
          onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un code
        </Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={promoCodes} isLoading={isLoading} />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      )}

      {/* Sheet form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Modifier le code promo" : "Nouveau code promo"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="EX: PROMO2025"
                disabled={!!editingId}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Type de réduction</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    discountType: v as "percent" | "fixed",
                  }))
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixe (DA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Valeur {form.discountType === "percent" ? "(%)" : "(DA)"}
              </Label>
              <Input
                type="number"
                min="0"
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountValue: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Commande minimum (DA)</Label>
              <Input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minOrderAmount: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Utilisations max (0 = illimité)</Label>
              <Input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxUses: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date d&apos;expiration</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
              />
            </div>

            <Button
              className="w-full bg-[#FF6B00] hover:bg-[#e65e00]"
              onClick={handleSubmit}
              disabled={isSaving || !form.code || !form.discountValue}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editingId ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-red-600">
                Erreur. Veuillez réessayer.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer le code promo"
        description="Cette action est irréversible. Voulez-vous continuer ?"
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId) }}
      />
    </div>
  );
}
