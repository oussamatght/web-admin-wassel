import { Search, Inbox, FileX2 } from "lucide-react";

interface EmptyStateProps {
  icon?: "search" | "inbox" | "file";
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const iconMap = {
  search: Search,
  inbox: Inbox,
  file: FileX2,
};

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-[#0D1B2A]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
