"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { getRoleLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Send, Loader2, CheckCircle, Users } from "lucide-react";
import type { Role } from "@/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "client", label: "Clients" },
  { value: "seller", label: "Vendeurs" },
  { value: "driver", label: "Livreurs" },
  { value: "prestataire", label: "Prestataires" },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [sent, setSent] = useState<number | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; message: string; roles: Role[] }) =>
      apiPost<{ sent: number }>("/admin/notifications/broadcast", data),
    onSuccess: (data) => {
      setSent(data.sent);
      setTitle("");
      setMessage("");
      setSelectedRoles([]);
    },
  });

  function toggleRole(role: Role) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setSent(null);
    broadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      roles: selectedRoles,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
          <Bell className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            Diffuser des notifications à vos utilisateurs
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#FF6B00]" />
              Nouvelle notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="notif-title">Titre</Label>
              <Input
                id="notif-title"
                placeholder="Ex: Mise à jour importante"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                placeholder="Le contenu de la notification..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* Target roles */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Destinataires
              </Label>
              <p className="text-xs text-slate-500">
                Laissez vide pour envoyer à tous les utilisateurs
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedRoles.includes(role.value)
                        ? "border-[#FF6B00] bg-orange-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}>
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <span className="text-sm font-medium">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Send button */}
            <Button
              className="w-full bg-[#FF6B00] hover:bg-[#e65e00]"
              onClick={handleSend}
              disabled={
                !title.trim() || !message.trim() || broadcastMutation.isPending
              }>
              {broadcastMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer la notification
                </>
              )}
            </Button>

            {/* Success */}
            {sent !== null && (
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">
                    Notification envoyée !
                  </p>
                  <p className="text-sm text-green-600">
                    {sent} utilisateur{sent > 1 ? "s" : ""} notifié
                    {sent > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {broadcastMutation.isError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                Erreur lors de l&apos;envoi. Veuillez réessayer.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
