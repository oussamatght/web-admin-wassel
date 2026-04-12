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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  DollarSign,
  Truck,
  Wrench,
  MapPin,
  Save,
  Loader2,
  Info,
  RotateCcw,
  Percent,
  Wallet,
} from "lucide-react";
import type { PlatformSettings } from "@/types";

const settingsSchema = z
  .object({
    pricePerKm: z.number().min(0),
    pricePerMinute: z.number().min(0),
    baseFee: z.number().min(0),
    minimumCharge: z.number().min(0),
    peakHourSurchargePercent: z.number().min(0).max(300),
    nightSurchargePercent: z.number().min(0).max(300),
    paymentProcessingFeePercent: z.number().min(0).max(30),
    smartRoundingStep: z.number().min(1).max(500),
    peakHourStart: z.number().min(0).max(23),
    peakHourEnd: z.number().min(0).max(23),
    nightHourStart: z.number().min(0).max(23),
    nightHourEnd: z.number().min(0).max(23),
    commissionType: z.enum(["percentage", "fixed"]),
    commissionValue: z.number().min(0),
    deliveryCommissionPercent: z.number().min(0).max(100, "Max 100%"),
    deliveryRevenuePlatformPercent: z.number().min(0).max(100),
    deliveryRevenueDriverPercent: z.number().min(0).max(100),
    deliveryRevenueSellerPercent: z.number().min(0).max(100),
    serviceSubscriptionFee: z.number().min(0),
    deliverySplitClient: z.number().min(0).max(1),
    deliverySplitSeller: z.number().min(0).max(1),
    returnDeliverySplitWassla: z.number().min(0).max(1),
    returnDeliverySplitSeller: z.number().min(0).max(1),
    minWithdrawalAmount: z.number().min(0),
    driverAssignmentTimeoutSeconds: z.number().min(30).max(3600),
  })
  .refine(
    (v) =>
      Math.abs(
        v.deliveryRevenuePlatformPercent +
          v.deliveryRevenueDriverPercent +
          v.deliveryRevenueSellerPercent -
          100,
      ) < 0.2,
    {
      message: "La répartition revenus livraison doit égaler 100%.",
      path: ["deliveryRevenueDriverPercent"],
    },
  )
  .refine(
    (v) => Math.abs(v.deliverySplitClient + v.deliverySplitSeller - 1) < 0.01,
    {
      message:
        "La répartition coût livraison (client/vendeur) doit égaler 100%.",
      path: ["deliverySplitSeller"],
    },
  )
  .refine(
    (v) =>
      Math.abs(v.returnDeliverySplitWassla + v.returnDeliverySplitSeller - 1) <
      0.01,
    {
      message: "La répartition retour (WASSLA/vendeur) doit égaler 100%.",
      path: ["returnDeliverySplitSeller"],
    },
  );

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => apiGet<{ settings: PlatformSettings }>("/admin/settings"),
    select: (d) => d.settings,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? {
          pricePerKm: settings.pricePerKm,
          pricePerMinute: settings.pricePerMinute,
          baseFee: settings.baseFee,
          minimumCharge: settings.minimumCharge,
          peakHourSurchargePercent: settings.peakHourSurchargePercent,
          nightSurchargePercent: settings.nightSurchargePercent,
          paymentProcessingFeePercent: settings.paymentProcessingFeePercent,
          smartRoundingStep: settings.smartRoundingStep,
          peakHourStart: settings.peakHourStart,
          peakHourEnd: settings.peakHourEnd,
          nightHourStart: settings.nightHourStart,
          nightHourEnd: settings.nightHourEnd,
          commissionType: settings.commissionType,
          commissionValue: settings.commissionValue,
          deliveryCommissionPercent: settings.deliveryCommissionPercent,
          deliveryRevenuePlatformPercent:
            settings.deliveryRevenuePlatformPercent ??
            settings.deliveryCommissionPercent ??
            8.7,
          deliveryRevenueDriverPercent:
            settings.deliveryRevenueDriverPercent ?? 91.3,
          deliveryRevenueSellerPercent:
            settings.deliveryRevenueSellerPercent ?? 0,
          serviceSubscriptionFee: settings.serviceSubscriptionFee,
          deliverySplitClient: settings.deliverySplitClient,
          deliverySplitSeller: settings.deliverySplitSeller,
          returnDeliverySplitWassla: settings.returnDeliverySplitWassla ?? 0.5,
          returnDeliverySplitSeller: settings.returnDeliverySplitSeller ?? 0.5,
          minWithdrawalAmount: settings.minWithdrawalAmount,
          driverAssignmentTimeoutSeconds:
            settings.driverAssignmentTimeoutSeconds ?? 300,
        }
      : undefined,
  });

  const commissionType = watch("commissionType");
  const commissionValue = watch("commissionValue");
  const splitClient = watch("deliverySplitClient");
  const revenuePlatform = watch("deliveryRevenuePlatformPercent");
  const revenueDriver = watch("deliveryRevenueDriverPercent");
  const revenueSeller = watch("deliveryRevenueSellerPercent");

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) =>
      apiPatch<{ settings: PlatformSettings }>("/admin/settings", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["platform-settings"], data.settings);
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
        pricePerKm: settings.pricePerKm,
        pricePerMinute: settings.pricePerMinute,
        baseFee: settings.baseFee,
        minimumCharge: settings.minimumCharge,
        peakHourSurchargePercent: settings.peakHourSurchargePercent,
        nightSurchargePercent: settings.nightSurchargePercent,
        paymentProcessingFeePercent: settings.paymentProcessingFeePercent,
        smartRoundingStep: settings.smartRoundingStep,
        peakHourStart: settings.peakHourStart,
        peakHourEnd: settings.peakHourEnd,
        nightHourStart: settings.nightHourStart,
        nightHourEnd: settings.nightHourEnd,
        commissionType: settings.commissionType,
        commissionValue: settings.commissionValue,
        deliveryCommissionPercent: settings.deliveryCommissionPercent,
        deliveryRevenuePlatformPercent:
          settings.deliveryRevenuePlatformPercent ??
          settings.deliveryCommissionPercent ??
          8.7,
        deliveryRevenueDriverPercent:
          settings.deliveryRevenueDriverPercent ?? 91.3,
        deliveryRevenueSellerPercent:
          settings.deliveryRevenueSellerPercent ?? 0,
        serviceSubscriptionFee: settings.serviceSubscriptionFee,
        deliverySplitClient: settings.deliverySplitClient,
        deliverySplitSeller: settings.deliverySplitSeller,
        returnDeliverySplitWassla: settings.returnDeliverySplitWassla ?? 0.5,
        returnDeliverySplitSeller: settings.returnDeliverySplitSeller ?? 0.5,
        minWithdrawalAmount: settings.minWithdrawalAmount,
        driverAssignmentTimeoutSeconds:
          settings.driverAssignmentTimeoutSeconds ?? 300,
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
          {Array.from({ length: 6 }).map((_, i) => (
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
            uniquement.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onChange={() => setIsDirty(true)}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Delivery Pricing Model */}
          <Card className="border-0 shadow-md md:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Truck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Tarification livraison (modèle mixte)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formule: (distance × prix/km) + (durée × prix/min) + base
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label
                    htmlFor="pricePerKm"
                    className="text-sm text-slate-600">
                    Prix par km (DA)
                  </Label>
                  <Input
                    id="pricePerKm"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("pricePerKm", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="pricePerMinute"
                    className="text-sm text-slate-600">
                    Prix par minute (DA)
                  </Label>
                  <Input
                    id="pricePerMinute"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("pricePerMinute", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="baseFee" className="text-sm text-slate-600">
                    Frais de base (DA)
                  </Label>
                  <Input
                    id="baseFee"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("baseFee", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="minimumCharge"
                    className="text-sm text-slate-600">
                    Minimum facturé (DA)
                  </Label>
                  <Input
                    id="minimumCharge"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("minimumCharge", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label
                    htmlFor="peakHourSurchargePercent"
                    className="text-sm text-slate-600">
                    Maj. heures de pointe (%)
                  </Label>
                  <Input
                    id="peakHourSurchargePercent"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("peakHourSurchargePercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="nightSurchargePercent"
                    className="text-sm text-slate-600">
                    Maj. nuit (%)
                  </Label>
                  <Input
                    id="nightSurchargePercent"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("nightSurchargePercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="paymentProcessingFeePercent"
                    className="text-sm text-slate-600">
                    Frais paiement (%)
                  </Label>
                  <Input
                    id="paymentProcessingFeePercent"
                    type="number"
                    step="0.1"
                    className="mt-1.5 h-11"
                    {...register("paymentProcessingFeePercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="smartRoundingStep"
                    className="text-sm text-slate-600">
                    Arrondi intelligent (step)
                  </Label>
                  <Input
                    id="smartRoundingStep"
                    type="number"
                    step="1"
                    className="mt-1.5 h-11"
                    {...register("smartRoundingStep", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label
                    htmlFor="peakHourStart"
                    className="text-sm text-slate-600">
                    Début pointe (h)
                  </Label>
                  <Input
                    id="peakHourStart"
                    type="number"
                    min="0"
                    max="23"
                    className="mt-1.5 h-11"
                    {...register("peakHourStart", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="peakHourEnd"
                    className="text-sm text-slate-600">
                    Fin pointe (h)
                  </Label>
                  <Input
                    id="peakHourEnd"
                    type="number"
                    min="0"
                    max="23"
                    className="mt-1.5 h-11"
                    {...register("peakHourEnd", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="nightHourStart"
                    className="text-sm text-slate-600">
                    Début nuit (h)
                  </Label>
                  <Input
                    id="nightHourStart"
                    type="number"
                    min="0"
                    max="23"
                    className="mt-1.5 h-11"
                    {...register("nightHourStart", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="nightHourEnd"
                    className="text-sm text-slate-600">
                    Fin nuit (h)
                  </Label>
                  <Input
                    id="nightHourEnd"
                    type="number"
                    min="0"
                    max="23"
                    className="mt-1.5 h-11"
                    {...register("nightHourEnd", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Type + Value */}
          <Card className="border-0 shadow-md md:col-span-2">
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
                    Prélevée sur chaque commande validée
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-slate-600">Type</Label>
                  <Select
                    value={commissionType}
                    onValueChange={(v) => {
                      setValue("commissionType", v as "fixed" | "percentage");
                      setIsDirty(true);
                    }}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Montant fixe (DA)</SelectItem>
                      <SelectItem value="percentage">
                        Pourcentage (%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="commissionValue"
                    className="text-sm text-slate-600">
                    {commissionType === "percentage"
                      ? "Pourcentage"
                      : "Montant"}
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="commissionValue"
                      type="number"
                      step={commissionType === "percentage" ? "0.1" : "1"}
                      className="pr-12 h-11"
                      {...register("commissionValue", { valueAsNumber: true })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                      {commissionType === "percentage" ? "%" : "DA"}
                    </span>
                  </div>
                  {errors.commissionValue && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.commissionValue.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Preview */}
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-700">
                  Aperçu : sur une commande de 5 000 DA, la commission sera de{" "}
                  <strong>
                    {commissionType === "percentage"
                      ? Math.round(5000 * ((commissionValue || 0) / 100))
                      : commissionValue || 0}{" "}
                    DA
                  </strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Commission */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4AA]/10">
                  <Truck className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Commission livraison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Part plateforme sur le coût de livraison
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="deliveryCommissionPercent"
                  className="text-sm text-slate-600">
                  Pourcentage (%)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="deliveryCommissionPercent"
                    type="number"
                    step="0.1"
                    className="pr-8 h-11"
                    {...register("deliveryCommissionPercent", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    %
                  </span>
                </div>
                {errors.deliveryCommissionPercent && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.deliveryCommissionPercent.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Actuel :</strong>{" "}
                  {settings?.deliveryCommissionPercent ?? 8.7}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Revenue Split */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Percent className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Répartition revenus livraison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Plateforme + Driver + Vendeur = 100%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label
                    htmlFor="deliveryRevenuePlatformPercent"
                    className="text-sm text-slate-600">
                    Plateforme (%)
                  </Label>
                  <Input
                    id="deliveryRevenuePlatformPercent"
                    type="number"
                    step="0.1"
                    className="mt-1.5 h-11"
                    {...register("deliveryRevenuePlatformPercent", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const v = Number.parseFloat(e.target.value);
                        const seller = Number(
                          watch("deliveryRevenueSellerPercent") || 0,
                        );
                        if (!Number.isNaN(v)) {
                          const driver = Math.max(0, 100 - v - seller);
                          setValue(
                            "deliveryRevenueDriverPercent",
                            Math.round(driver * 10) / 10,
                          );
                        }
                      },
                    })}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="deliveryRevenueDriverPercent"
                    className="text-sm text-slate-600">
                    Driver (%)
                  </Label>
                  <Input
                    id="deliveryRevenueDriverPercent"
                    type="number"
                    step="0.1"
                    className="mt-1.5 h-11 bg-slate-50"
                    readOnly
                    {...register("deliveryRevenueDriverPercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="deliveryRevenueSellerPercent"
                    className="text-sm text-slate-600">
                    Vendeur (%)
                  </Label>
                  <Input
                    id="deliveryRevenueSellerPercent"
                    type="number"
                    step="0.1"
                    className="mt-1.5 h-11"
                    {...register("deliveryRevenueSellerPercent", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const v = Number.parseFloat(e.target.value);
                        const platform = Number(
                          watch("deliveryRevenuePlatformPercent") || 0,
                        );
                        if (!Number.isNaN(v)) {
                          const driver = Math.max(0, 100 - platform - v);
                          setValue(
                            "deliveryRevenueDriverPercent",
                            Math.round(driver * 10) / 10,
                          );
                        }
                      },
                    })}
                  />
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Somme actuelle:{" "}
                  <strong>
                    {(
                      (revenuePlatform || 0) +
                      (revenueDriver || 0) +
                      (revenueSeller || 0)
                    ).toFixed(1)}
                    %
                  </strong>
                </p>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="driverAssignmentTimeoutSeconds"
                  className="text-sm text-slate-600">
                  Timeout assignation driver (secondes)
                </Label>
                <Input
                  id="driverAssignmentTimeoutSeconds"
                  type="number"
                  step="10"
                  className="mt-1.5 h-11"
                  {...register("driverAssignmentTimeoutSeconds", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Cost Split */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Répartition livraison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Part client / vendeur dans le coût
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="deliverySplitClient"
                    className="text-sm text-slate-600">
                    Client (%)
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="deliverySplitClient"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="pr-8 h-11"
                      {...register("deliverySplitClient", {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v))
                            setValue(
                              "deliverySplitSeller",
                              Math.round((1 - v) * 100) / 100,
                            );
                        },
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="deliverySplitSeller"
                    className="text-sm text-slate-600">
                    Vendeur (%)
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="deliverySplitSeller"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="h-11 bg-slate-50"
                      readOnly
                      {...register("deliverySplitSeller", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Client paie{" "}
                  <strong>{Math.round((splitClient || 0.5) * 100)}%</strong>,
                  vendeur paie{" "}
                  <strong>
                    {Math.round((1 - (splitClient || 0.5)) * 100)}%
                  </strong>{" "}
                  du coût de livraison
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Subscription */}
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
                  htmlFor="serviceSubscriptionFee"
                  className="text-sm text-slate-600">
                  Montant mensuel (DA)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="serviceSubscriptionFee"
                    type="number"
                    step="1"
                    className="pr-12 h-11"
                    {...register("serviceSubscriptionFee", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    DA
                  </span>
                </div>
                {errors.serviceSubscriptionFee && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.serviceSubscriptionFee.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Actuel :</strong>{" "}
                  {formatDA(settings?.serviceSubscriptionFee ?? 800)} / mois
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Min Withdrawal */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">
                    Retrait minimum
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seuil minimum pour demander un retrait
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="minWithdrawalAmount"
                  className="text-sm text-slate-600">
                  Montant minimum (DA)
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="minWithdrawalAmount"
                    type="number"
                    step="100"
                    className="pr-12 h-11"
                    {...register("minWithdrawalAmount", {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    DA
                  </span>
                </div>
                {errors.minWithdrawalAmount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.minWithdrawalAmount.message}
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <strong>Actuel :</strong>{" "}
                  {formatDA(settings?.minWithdrawalAmount ?? 1000)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Separator className="my-6" />
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="gap-2 bg-[#FF6B00] hover:bg-[#E05E00]">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
