"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Shield,
} from "lucide-react";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      apiPost<{ user: User; accessToken: string; refreshToken: string }>(
        "/auth/admin-login",
        data,
      ),
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      toast.success("Connexion reussie");
      router.replace("/dashboard");
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (axiosErr.response?.status === 403) {
        setError("Acces refuse — compte admin requis");
      } else {
        setError("Erreur de connexion. Verifiez que le serveur est en ligne.");
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[60%_40%]">
      {/* LEFT SIDE - Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-linear-to-br from-[#0D1B2A] to-[#1E3A5F] p-12">
        <div className="text-center">
          <div className="mx-auto mb-6"></div>
          <h1 className="text-6xl font-black text-white tracking-tight">
            WASSLA
          </h1>
          <p className="mt-1 text-2xl text-[#FF6B00]/80 font-medium">
            {"\u0648\u0635\u0644\u0629"}
          </p>
          <p className="mt-2 text-lg text-slate-400">
            Dashboard Administrateur
          </p>

          <div className="mx-auto mt-10 w-16 border-t border-slate-600" />

          <div className="mt-10 space-y-5 text-left max-w-xs mx-auto">
            {[
              "Gestion complete des utilisateurs",
              "Suivi des commandes en temps reel",
              "Rapports financiers detailles",
              "Gestion des commissions & litiges",
              "Confidentialite client/vendeur totale",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[#00D4AA] shrink-0" />
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="flex items-center justify-center bg-slate-50 p-8">
        <Card className="w-full max-w-md shadow-xl rounded-2xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-[#FF6B00]" />
                <h2 className="text-2xl font-bold text-[#0D1B2A]">Connexion</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Acces reserve aux administrateurs
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700">
                    Adresse email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@wassla.com"
                      className="pl-10 h-11"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700">
                    Mot de passe
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      className="pl-10 pr-10 h-11"
                      autoComplete="current-password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-6 w-full h-11 bg-[#FF6B00] hover:bg-[#CC5200] text-white font-semibold">
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
