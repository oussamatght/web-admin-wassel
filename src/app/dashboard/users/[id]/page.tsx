"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import {
  formatDA,
  formatDate,
  formatDateTime,
  getInitials,
  getRoleLabel,
  getRoleColor,
  getAccountStatusLabel,
  getAccountStatusColor,
} from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle,
  Pause,
  Ban,
  Star,
  ShoppingBag,
  Package,
  Truck,
  Wallet,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Store,
  CreditCard,
  FileText,
  MessageSquare,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import type { User } from "@/types";
import { useState } from "react";

interface UserDetailResponse {
  user: User;
  stats: { orderCount: number; productCount: number; reviewCount: number };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => apiGet<UserDetailResponse>("/admin/users/" + id),
    enabled: !!id,
  });

  const user = data?.user;
  const stats = data?.stats;

  const statusMutation = useMutation({
    mutationFn: ({
      accountStatus,
      reason,
    }: {
      accountStatus: string;
      reason?: string;
    }) => apiPatch("/admin/users/" + id + "/status", { accountStatus, reason }),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiPatch("/admin/users/" + id + "/verify"),
    onSuccess: () => {
      toast.success("Utilisateur vérifié");
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Erreur de vérification"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Utilisateur introuvable</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Commandes",
      value: stats?.orderCount ?? 0,
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      label: "Produits",
      value: stats?.productCount ?? 0,
      icon: Package,
      color: "text-orange-600",
    },
    {
      label: "Avis",
      value: stats?.reviewCount ?? 0,
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      label: "Solde",
      value: formatDA(user.wallet ?? 0),
      icon: Wallet,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/users")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Utilisateurs
      </Button>

      {/* Hero Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ${
                    user.role === "seller"
                      ? "bg-orange-500"
                      : user.role === "driver"
                        ? "bg-teal-500"
                        : user.role === "prestataire"
                          ? "bg-purple-500"
                          : "bg-blue-500"
                  }`}>
                  {getInitials(user.firstName, user.lastName)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-[#0D1B2A]">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge
                  variant="outline"
                  className={getRoleColor(user.role) + " font-medium"}>
                  {getRoleLabel(user.role)}
                </Badge>
                <StatusBadge status={user.accountStatus} type="account" />
                {user.isVerified && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" /> Vérifié
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {user.wilaya}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Inscrit le{" "}
                  {formatDate(user.createdAt)}
                </span>
              </div>

              {user.shopName && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Store className="h-3.5 w-3.5" /> {user.shopName}
                </div>
              )}

              {(user.role === "seller" || user.role === "driver") &&
                user.rating?.count > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {user.rating.average.toFixed(1)}
                    </span>
                    <span className="text-slate-400">
                      ({user.rating.count} avis)
                    </span>
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 self-start">
              {user.accountStatus === "pending_verification" && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: "Vérifier cet utilisateur ?",
                      description:
                        user.firstName +
                        " " +
                        user.lastName +
                        " sera marqué comme vérifié.",
                      variant: "default",
                      onConfirm: async () => {
                        await verifyMutation.mutateAsync();
                      },
                    })
                  }>
                  <CheckCircle className="mr-1 h-4 w-4" /> Vérifier
                </Button>
              )}
              {user.accountStatus !== "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: "Activer ce compte ?",
                      description: "Le compte sera réactivé.",
                      variant: "default",
                      onConfirm: async () => {
                        await statusMutation.mutateAsync({
                          accountStatus: "active",
                        });
                      },
                    })
                  }>
                  <CheckCircle className="mr-1 h-4 w-4" /> Activer
                </Button>
              )}
              {user.accountStatus !== "suspended" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: "Suspendre ce compte ?",
                      description:
                        user.firstName +
                        " ne pourra plus accéder à la plateforme.",
                      variant: "warning",
                      onConfirm: async () => {
                        await statusMutation.mutateAsync({
                          accountStatus: "suspended",
                        });
                      },
                    })
                  }>
                  <Pause className="mr-1 h-4 w-4" /> Suspendre
                </Button>
              )}
              {user.accountStatus !== "banned" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: "Bannir ce compte ?",
                      description: "Attention, action irréversible.",
                      variant: "danger",
                      onConfirm: async () => {
                        await statusMutation.mutateAsync({
                          accountStatus: "banned",
                        });
                      },
                    })
                  }>
                  <Ban className="mr-1 h-4 w-4" /> Bannir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className={`rounded-lg bg-slate-50 p-2 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-lg font-bold text-[#0D1B2A]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Général</TabsTrigger>
              <TabsTrigger value="wallet">Portefeuille</TabsTrigger>
              {(user.role === "seller" ||
                user.role === "driver" ||
                user.role === "prestataire") && (
                <TabsTrigger value="documents">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Documents
                  {user.documents && user.documents.length > 0
                    ? ` (${user.documents.length})`
                    : ""}
                </TabsTrigger>
              )}
              {user.role === "seller" && (
                <TabsTrigger value="seller">Boutique</TabsTrigger>
              )}
              {user.role === "driver" && (
                <TabsTrigger value="driver">Livreur</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Prénom" value={user.firstName} />
                <InfoRow label="Nom" value={user.lastName} />
                <InfoRow label="Téléphone" value={user.phone} />
                <InfoRow label="Email" value={user.email || "—"} />
                <InfoRow label="Wilaya" value={user.wilaya} />
                <InfoRow label="Rôle" value={getRoleLabel(user.role)} />
                <InfoRow
                  label="Statut du compte"
                  value={getAccountStatusLabel(user.accountStatus)}
                />
                <InfoRow
                  label="Inscrit"
                  value={formatDateTime(user.createdAt)}
                />
                <InfoRow
                  label="Vérifié"
                  value={user.isVerified ? "Oui" : "Non"}
                />
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow
                  label="Solde disponible"
                  value={formatDA(user.wallet ?? 0)}
                  highlight
                />
                {user.baridiMobAccount && (
                  <InfoRow
                    label="Compte BaridiMob"
                    value={user.baridiMobAccount}
                    icon={<CreditCard className="h-3.5 w-3.5 text-slate-400" />}
                  />
                )}
              </div>
            </TabsContent>

            {(user.role === "seller" ||
              user.role === "driver" ||
              user.role === "prestataire") && (
              <TabsContent value="documents" className="mt-4">
                {user.documents && user.documents.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      {user.documents.length} document
                      {user.documents.length > 1 ? "s" : ""} soumis par
                      l&apos;utilisateur
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {user.documents.map((doc, idx) => {
                        const isImage =
                          /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.url) ||
                          doc.url.includes("/image/");
                        return (
                          <div
                            key={doc.publicId || idx}
                            className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Preview */}
                            {isImage ? (
                              <div className="aspect-4/3 bg-slate-50">
                                <img
                                  src={doc.url}
                                  alt={doc.type}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="aspect-4/3 bg-slate-50 flex items-center justify-center">
                                <FileText className="h-16 w-16 text-slate-300" />
                              </div>
                            )}
                            {/* Info bar */}
                            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                              <div className="flex items-center gap-2 min-w-0">
                                <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 truncate">
                                  {doc.type || `Document ${idx + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#FF6B00] transition-colors"
                                  title="Ouvrir">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <a
                                  href={doc.url}
                                  download
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                  title="Télécharger">
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Aucun document soumis
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      L&apos;utilisateur n&apos;a pas encore envoyé de documents
                      de vérification
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {user.role === "seller" && (
              <TabsContent value="seller" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow
                    label="Nom de boutique"
                    value={user.shopName || "—"}
                  />
                  <InfoRow
                    label="Évaluation"
                    value={
                      user.rating?.count > 0
                        ? user.rating.average.toFixed(1) +
                          " / 5 (" +
                          user.rating.count +
                          " avis)"
                        : "Aucun avis"
                    }
                  />
                  <InfoRow
                    label="Produits"
                    value={String(stats?.productCount ?? 0)}
                  />
                  <InfoRow
                    label="Commandes"
                    value={String(stats?.orderCount ?? 0)}
                  />
                </div>
              </TabsContent>
            )}

            {user.role === "driver" && (
              <TabsContent value="driver" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow
                    label="Évaluation"
                    value={
                      user.rating?.count > 0
                        ? user.rating.average.toFixed(1) +
                          " / 5 (" +
                          user.rating.count +
                          " avis)"
                        : "Aucun avis"
                    }
                  />
                  <InfoRow
                    label="Livraisons"
                    value={String(stats?.orderCount ?? 0)}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

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

function InfoRow({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-slate-100 px-4 py-3">
      <span className="text-sm text-slate-500 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={`text-sm font-medium ${highlight ? "text-[#FF6B00]" : "text-[#0D1B2A]"}`}>
        {value}
      </span>
    </div>
  );
}
