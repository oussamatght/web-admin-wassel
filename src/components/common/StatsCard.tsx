"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
  onClick?: () => void;
  /** 'default' | 'gradient' — gradient applies an orange gradient background */
  variant?: "default" | "gradient";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[#FF6B00]",
  iconBg = "bg-[#FF6B00]/10",
  trend,
  subtitle,
  onClick,
  variant = "default",
}: StatsCardProps) {
  const isGradient = variant === "gradient";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
        isGradient
          ? "border-transparent bg-linear-to-br from-[#FF6B00] to-[#CC5500] text-white shadow-lg shadow-[#FF6B00]/20 hover:shadow-xl hover:shadow-[#FF6B00]/30"
          : "border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}>
      {/* Decorative gradient orb */}
      {!isGradient && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FF6B00]/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#FF6B00]/8" />
      )}

      <div className="relative flex items-center justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            isGradient ? "bg-white/20" : iconBg,
          )}>
          <Icon
            className={cn("h-5 w-5", isGradient ? "text-white" : iconColor)}
          />
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isGradient ? "text-white/80" : "text-slate-500",
          )}>
          {title}
        </span>
      </div>

      <p
        className={cn(
          "relative mt-4 text-2xl font-extrabold tracking-tight",
          isGradient ? "text-white" : "text-[#0D1B2A]",
        )}>
        {value}
      </p>

      <div className="relative mt-2 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              isGradient
                ? trend.value >= 0
                  ? "text-green-200"
                  : "text-red-200"
                : trend.value >= 0
                  ? "text-green-600"
                  : "text-red-600",
            )}>
            {trend.value >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
        {subtitle && (
          <span
            className={cn(
              "text-xs",
              isGradient ? "text-white/60" : "text-slate-400",
            )}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
