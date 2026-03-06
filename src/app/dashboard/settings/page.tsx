"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { formatDA } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  DollarSign,
  Truck,
  Wrench,
  MapPin,
  Save,
  Loader2,
  Info,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import type { PlatformSettings } from "@/types";

const settingsSchema = z.object({
  sellerCommission: z.number().min(0, "Min 0 DA"),
  driverCommissionPercent: z.number().min(0).max(100, "Max 100%"),
  serviceProviderSubscription: z.number().min(0, "Min 0 DA"),
  sellerLocalDeliverySharePercent: z.number().min(0).max(100, "Max 100%"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => apiGet<PlatformSettings>("/admin/settings"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? {
          sellerCommission: settings.sellerCommission,
          driverCommissionPercent: settings.driverCommissionPercent,
          serviceProviderSubscription: settings.serviceProviderSubscription,
          sellerLocalDeliverySharePercent:
            settings.sellerLocalDeliverySharePercent,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) =>
      apiPatch<PlatformSettings>("/admin/settings", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["platform-settings"], data);
      setIsDirty(false);
      toast.success("Paramètres mis à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  const handleReset = () => {
    if (settings) {
      reset({
        sellerCommission: settings.sellerCommission,
        driverCommissionPercent: settings.driverCommissionPercent,
        serviceProviderSubscription: settings.serviceProviderSubscription,
        sellerLocalDeliverySharePercent:
          settings.sellerLocalDeliverySharePercent,
      });
      setIsDirty(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Paramètres</h1>
          <p className="text-sm text-slate-500">
            Configuration de la plateforme
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Paramètres</h1>
          <p className="text-sm text-slate-500">
            Configuration des commissions et abonnements
          </p>
        </div>
        {settings?.updatedAt && (
          <p className="text-xs text-slate-400">
            Dernière modification :{" "}
            {new Date(settings.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Modification des commissions</p>
          <p className="mt-1 text-blue-600">
            Les modifications s&apos;appliqueront aux nouvelles commandes
            uniquement. Les commandes existantes conservent leurs valeurs de
            commission d&apos;origine.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onChange={() => setIsDirty(true)}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Seller Commission */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00]/10">
                  <DollarSign className="h-5 w-5 text-[#FF6B00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Commission vendeur
                  </h3>
                  <p className="text-xs text-slate-400">
                    Montant fixe par commande validée
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="sellerCommission"
                  className="text-sm text-slate-600">
                  Montant (DA)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="sellerCommission"
                    type="number"
                    step="1"
                    className="pr-12 h-11"
                    {...register("sellerCommission", { valueAsNumber: true })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    DA
                  </span>
                </div>
                {errors.sellerCommission && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.sellerCommission.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Valeur actuelle :</strong>{" "}
                  {formatDA(settings?.sellerCommission ?? 250)} par commande
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Déduit automatiquement du montant que reçoit le vendeur
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Driver Commission */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4AA]/10">
                  <Truck className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Commission livreur
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pourcentage sur le coût de livraison
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="driverCommissionPercent"
                  className="text-sm text-slate-600">
                  Pourcentage (%)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="driverCommissionPercent"
                    type="number"
                    step="0.1"
                    className="pr-8 h-11"
                    {...register("driverCommissionPercent", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    %
                  </span>
                </div>
                {errors.driverCommissionPercent && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.driverCommissionPercent.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Valeur actuelle :</strong>{" "}
                  {settings?.driverCommissionPercent ?? 8.7}%
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Prélevé sur le montant de la livraison encaissé par le livreur
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Provider Subscription */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Abonnement prestataire
                  </h3>
                  <p className="text-xs text-slate-400">
                    Frais mensuel pour les prestataires
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="serviceProviderSubscription"
                  className="text-sm text-slate-600">
                  Montant mensuel (DA)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="serviceProviderSubscription"
                    type="number"
                    step="1"
                    className="pr-12 h-11"
                    {...register("serviceProviderSubscription", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    DA
                  </span>
                </div>
                {errors.serviceProviderSubscription && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.serviceProviderSubscription.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Valeur actuelle :</strong>{" "}
                  {formatDA(settings?.serviceProviderSubscription ?? 800)} /
                  mois
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Facturé mensuellement aux prestataires de services
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Local Delivery Share */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Part livraison locale
                  </h3>
                  <p className="text-xs text-slate-400">
                    Part du vendeur dans la livraison locale
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="sellerLocalDeliverySharePercent"
                  className="text-sm text-slate-600">
                  Pourcentage vendeur (%)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="sellerLocalDeliverySharePercent"
                    type="number"
                    step="1"
                    className="pr-8 h-11"
                    {...register("sellerLocalDeliverySharePercent", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    %
                  </span>
                </div>
                {errors.sellerLocalDeliverySharePercent && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.sellerLocalDeliverySharePercent.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Valeur actuelle :</strong>{" "}
                  {settings?.sellerLocalDeliverySharePercent ?? 50}%
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Le vendeur paie ce pourcentage des frais de livraison locale
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isDirty ? (
              <span className="text-amber-600 font-medium">
                Modifications non enregistrées
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />À jour
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || updateMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="bg-[#FF6B00] hover:bg-[#CC5200] text-white">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Business Rules Summary */}
      <Card className="border-0 shadow-md mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[#0D1B2A] mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            Règles métier de la plateforme
          </h3>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Confidentialité :</strong> Le client et le vendeur ne
                  se voient jamais. Seul le livreur connaît les deux parties.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>QR Code :</strong> Généré au statut &quot;Prête à
                  enlever&quot;. Le livreur scanne pour confirmer la prise en
                  charge.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Retours :</strong> Produits défectueux/incompatibles —
                  frais à charge du vendeur. La plateforme ne rembourse pas de
                  ses propres fonds.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Évaluation :</strong> Le système de notation affecte
                  la visibilité et la priorité des vendeurs.
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Livraison hors-wilaya :</strong> Responsabilité totale
                  du vendeur. La plateforme supervise mais ne gère pas.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Sanctions :</strong> L&apos;admin peut bloquer
                  produits, suspendre paiements, bannir utilisateurs.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Rôle plateforme :</strong> Intermédiaire entre
                  vendeur, livreur et client. Ne détient jamais la marchandise.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  <strong>Flux commande :</strong> pending → confirmed →
                  preparing → ready_for_pickup → in_delivery → delivered
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
