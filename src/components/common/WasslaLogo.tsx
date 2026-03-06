import Image from "next/image";

export function WasslaLogo({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Wassla"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}
