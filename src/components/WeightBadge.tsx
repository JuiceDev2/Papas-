import type { Presentation } from "@/lib/types";

const FLAVOR_COLORS: Record<string, string> = {
  Natural: "bg-gold",
  "Chile Picante": "bg-chili",
  Limón: "bg-avocado",
  Queso: "bg-gold-dark",
  BBQ: "bg-coffee",
};

export function flavorColorClass(flavor: string): string {
  return FLAVOR_COLORS[flavor] || "bg-gold";
}

export default function WeightBadge({ presentation }: { presentation: Presentation }) {
  const label = presentation === "150g" ? "150 g" : "1 kg";
  return (
    <span className="absolute bottom-2 right-2 rounded-full bg-coffee text-cream text-xs font-mono font-bold px-2 py-1 shadow">
      {label}
    </span>
  );
}
