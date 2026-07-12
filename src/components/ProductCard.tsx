"use client";

import type { Product } from "@/lib/types";
import { formatMXN, formatPresentation } from "@/lib/currency";
import WeightBadge, { flavorColorClass } from "@/components/WeightBadge";

export default function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  return (
    <div className="bg-paper rounded-2xl shadow-sm border border-black/5 overflow-hidden flex flex-col">
      <div className={`relative h-28 bag-shape ${flavorColorClass(product.flavor)} flex items-center justify-center`}>
        <span className="text-4xl" aria-hidden>
          🥔
        </span>
        <WeightBadge presentation={product.presentation} />
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-display font-bold text-coffee leading-tight">{product.name}</p>
        <p className="text-sm text-coffee/70">{product.flavor}</p>
        <p className="text-xs text-coffee/50">{formatPresentation(product.presentation)}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono font-bold text-chili">{formatMXN(product.price)}</span>
          <button
            onClick={() => onAdd(product)}
            className="bg-chili hover:bg-chili-dark text-cream text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
