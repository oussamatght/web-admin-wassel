import { Loader2 } from "lucide-react";

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "Chargement..." }: LoadingPageProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00]" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
