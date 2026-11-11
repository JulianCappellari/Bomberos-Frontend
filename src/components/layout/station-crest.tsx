import Image from "next/image";

export function StationCrest({ height, label = "" }: { height: number; label?: string }) {
  return (
    <Image
      src="/escudo-sampacho.png"
      alt={label}
      width={Math.round(height * 1026 / 1280)}
      height={height}
      className="block shrink-0 rounded-sm"
    />
  );
}
