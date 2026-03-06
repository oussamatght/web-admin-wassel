import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500",
  seller: "bg-orange-500",
  driver: "bg-teal-500",
  prestataire: "bg-purple-500",
  client: "bg-blue-500",
};

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  role = "client",
  size = "md",
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const bgColor = roleColors[role] ?? "bg-blue-500";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${bgColor} flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white`}>
      {getInitials(firstName, lastName)}
    </div>
  );
}
