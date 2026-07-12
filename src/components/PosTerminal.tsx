"use client";

import { useMemo, useState } from "react";
import type { CartLine, Product } from "@/lib/types";
import { formatMXN, formatPresentation } from "@/lib/currency";
import { flavorColorClass } from "@/components/WeightBadge";
import TicketReceipt, { type TicketData } from "@/components/TicketReceipt";
import { createPosSale } from "@/app/actions";

export default function PosTerminal({ products }: { products: Product[] }) {
  const [sale, setSale] = useState<CartLine[]>([]);
  const [received, setReceived] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);

  const total = sale.reduce((s, l) => s + l.qty * l.product.price, 0);
  const receivedNum = Number(received) || 0;
  const change = receivedNum - total;

  const canCharge = sale.length > 0 && receivedNum >= total;

  function addProduct(product: Product) {
    setSale((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    setSale((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId ? { ...l, qty } : l))
    );
  }

  async function handleCharge() {
    setSubmitting(true);
    setError(null);
    const result = await createPosSale(
      sale.map((l) => ({ product_id: l.product.id, qty: l.qty })),
      receivedNum
    );
    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if ("success" in result) {
      setTicket({
        folio: result.folio!,
        items: sale.map((l) => ({
          name: l.product.name,
          flavor: l.product.flavor,
          presentation: l.product.presentation,
          qty: l.qty,
          subtotal: l.qty * l.product.price,
        })),
        total: result.total!,
        received: receivedNum,
        change: result.change!,
        createdAt: new Date().toISOString(),
        message: "Venta registrada",
      });
      setSale([]);
      setReceived("");
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-6">Punto de venta</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product buttons */}
        <div className="order-last lg:order-none lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className={`rounded-xl p-3 text-left text-cream ${flavorColorClass(p.flavor)} hover:opacity-90 active:scale-95 transition-transform`}
            >
              <p className="font-semibold text-sm">{p.flavor}</p>
              <p className="text-xs opacity-80">{formatPresentation(p.presentation)}</p>
              <p className="font-mono font-bold mt-1">{formatMXN(p.price)}</p>
            </button>
          ))}
        </div>

        {/* Current sale */}
        <div className="order-first lg:order-none bg-paper rounded-2xl p-4 shadow-sm flex flex-col lg:sticky lg:top-4 lg:self-start">
          <p className="font-semibold text-coffee mb-2">Venta actual</p>
          <div className="flex-1 space-y-2 min-h-[100px]">
            {sale.length === 0 && <p className="text-sm text-coffee/50">Toca un producto para agregarlo.</p>}
            {sale.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{l.product.flavor} ({formatPresentation(l.product.presentation)})</span>
                <button onClick={() => updateQty(l.product.id, l.qty - 1)} className="w-6 h-6 bg-cream rounded-full font-bold">−</button>
                <span className="w-5 text-center">{l.qty}</span>
                <button onClick={() => updateQty(l.product.id, l.qty + 1)} className="w-6 h-6 bg-cream rounded-full font-bold">+</button>
                <span className="font-mono w-16 text-right">{formatMXN(l.qty * l.product.price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-coffee/10 mt-3 pt-3 space-y-2">
            <div className="flex justify-between font-bold text-coffee">
              <span>Total</span>
              <span className="font-mono">{formatMXN(total)}</span>
            </div>

            <div>
              <label className="text-sm text-coffee/70">Recibido</label>
              <input
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-between text-sm text-coffee/70">
              <span>Cambio</span>
              <span className="font-mono">{formatMXN(Math.max(change, 0))}</span>
            </div>

            {error && <p className="text-chili text-sm">{error}</p>}

            <button
              disabled={!canCharge || submitting}
              onClick={handleCharge}
              className="w-full bg-avocado disabled:opacity-40 text-cream font-semibold py-2.5 rounded-full"
            >
              {submitting ? "Guardando..." : "Cobrar y generar ticket"}
            </button>
          </div>
        </div>
      </div>

      {ticket && <TicketReceipt ticket={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}
