import Image from "next/image";

export function StationCrest({ height, label = "" }: { height: number; label?: string }) {
  return (
    <Image
      src="/escudo-sampacho.png"
      alt={label}
      width={800}
      height={1000}
      className="block w-auto shrink-0"
      style={{ height }}
    />
  );
}
