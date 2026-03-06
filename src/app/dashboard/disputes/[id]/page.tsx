"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  getDisputeReasonLabel,
  getDisputeStatusLabel,
  getDisputeStatusColor,
} from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  User,
  Package,
  ImageIcon,
  Loader2,
  ShieldOff,
} from "lucide-react";
import type { Dispute } from "@/types";

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [resolution, setResolution] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [resolveStatus, setResolveStatus] = useState<string>("");

  const { data: dispute, isLoading } = useQuery({
    queryKey: ["dispute", id],
    queryFn: () =>
      apiGet<{ dispute: Dispute }>(`/disputes/${id}`).then((r) => r.dispute),
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: (data: {
      status: string;
      resolution: string;
      adminNote: string;
    }) => apiPatch(`/disputes/${id}/resolve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
  });

  const blockSellerMutation = useMutation({
    mutationFn: (sellerId: string) =>
      apiPatch(`/admin/users/${sellerId}/status`, {
        accountStatus: "suspended",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleResolve = () => {
    if (!resolveStatus || !resolution) return;
    resolveMutation.mutate({
      status: resolveStatus,
      resolution,
      adminNote,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-slate-400" />
        <p className="text-slate-500">Litige introuvable</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/disputes")}>
          Retour aux litiges
        </Button>
      </div>
    );
  }

  const isResolvable =
    dispute.status === "open" ||
    dispute.status === "under_review" ||
    dispute.status === "escalated";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/disputes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Litige #{dispute._id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-sm text-slate-500">
            Créé le {formatDateTime(dispute.createdAt)}
          </p>
        </div>
        <StatusBadge status={dispute.status} type="dispute" size="md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left - Info */}
        <div className="space-y-6">
          {/* Dispute info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Détails du litige
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Raison</p>
                  <Badge variant="outline" className="mt-1">
                    {getDisputeReasonLabel(dispute.reason)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Statut</p>
                  <div className="mt-1">
                    <StatusBadge status={dispute.status} type="dispute" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Description
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {dispute.description}
                </p>
              </div>
              {dispute.resolution && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Résolution
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {dispute.resolution}
                  </p>
                </div>
              )}
              {dispute.adminNote && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Note admin
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {dispute.adminNote}
                  </p>
                </div>
              )}
              {dispute.resolvedAt && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Résolu le
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatDateTime(dispute.resolvedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-500" />
                Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {dispute.client?.firstName?.[0]}
                  {dispute.client?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {dispute.client?.firstName} {dispute.client?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">Client</p>
                </div>
              </div>
              {dispute.seller && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                      {dispute.seller.firstName?.[0]}
                      {dispute.seller.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {dispute.seller.firstName} {dispute.seller.lastName}
                      </p>
                      <p className="text-xs text-slate-500">Vendeur</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={blockSellerMutation.isPending}
                    onClick={() =>
                      blockSellerMutation.mutate(dispute.seller!._id)
                    }>
                    {blockSellerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Blocage...
                      </>
                    ) : (
                      <>
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Bloquer ce vendeur
                      </>
                    )}
                  </Button>
                  {blockSellerMutation.isSuccess && (
                    <p className="rounded-lg bg-red-50 p-2 text-center text-xs text-red-700">
                      Vendeur suspendu avec succès.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence images */}
          {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-purple-500" />
                  Preuves ({dispute.evidenceImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dispute.evidenceImages.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden rounded-lg border">
                      <img
                        src={img.url}
                        alt={`Preuve ${i + 1}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Resolve form */}
        <div className="space-y-6">
          {isResolvable ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Résoudre le litige
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Décision</Label>
                  <Select
                    value={resolveStatus}
                    onValueChange={setResolveStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une décision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved_refund">
                        Remboursement
                      </SelectItem>
                      <SelectItem value="resolved_no_refund">
                        Pas de remboursement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Résolution / Explication</Label>
                  <Textarea
                    placeholder="Expliquer la résolution..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Note admin (optionnel)</Label>
                  <Textarea
                    placeholder="Note interne..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  className="w-full bg-[#FF6B00] hover:bg-[#e65e00]"
                  onClick={handleResolve}
                  disabled={
                    !resolveStatus || !resolution || resolveMutation.isPending
                  }>
                  {resolveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Résoudre le litige"
                  )}
                </Button>

                {resolveMutation.isSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    Litige résolu avec succès.
                  </div>
                )}

                {resolveMutation.isError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    Erreur lors de la résolution. Veuillez réessayer.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="font-medium text-slate-700">
                  Ce litige est{" "}
                  {getDisputeStatusLabel(dispute.status).toLowerCase()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order info */}
          {dispute.order && typeof dispute.order === "object" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-orange-500" />
                  Commande associée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Numéro</p>
                    <p className="font-medium">
                      {(dispute.order as { orderNumber?: string })
                        .orderNumber ??
                        dispute.order._id?.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Statut</p>
                    <StatusBadge
                      status={
                        (dispute.order as { status?: string }).status ??
                        "pending"
                      }
                      type="order"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/dashboard/orders/${typeof dispute.order === "object" ? (dispute.order as { _id: string })._id : dispute.order}`,
                    )
                  }>
                  Voir la commande
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
