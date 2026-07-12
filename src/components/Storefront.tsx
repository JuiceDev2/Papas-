"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CartLine, Product } from "@/lib/types";
import { formatMXN, formatPresentation } from "@/lib/currency";
import ProductCard from "@/components/ProductCard";
import { flavorColorClass } from "@/components/WeightBadge";
import TicketReceipt, { type TicketData } from "@/components/TicketReceipt";
import { createClienteOrder } from "@/app/actions";

export default function Storefront({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [slide, setSlide] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const popular = useMemo(() => {
    const p = products.filter((x) => x.popular);
    return (p.length ? p : products).slice(0, 6);
  }, [products]);

  useEffect(() => {
    if (popular.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % popular.length), 4500);
    return () => clearInterval(id);
  }, [popular.length]);

  const totalItems = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.product.price, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId ? { ...l, qty } : l))
    );
  }

  async function submitCheckout(formData: FormData) {
    setSubmitting(true);
    setFormError(null);
    const name = String(formData.get("name") || "");
    const phone = String(formData.get("phone") || "");

    const result = await createClienteOrder(
      name,
      phone,
      cart.map((l) => ({ product_id: l.product.id, qty: l.qty }))
    );

    setSubmitting(false);

    if ("error" in result && result.error) {
      setFormError(result.error);
      return;
    }

    if ("success" in result) {
      setTicket({
        folio: result.folio!,
        customerName: name,
        customerPhone: phone,
        items: cart.map((l) => ({
          name: l.product.name,
          flavor: l.product.flavor,
          presentation: l.product.presentation,
          qty: l.qty,
          subtotal: l.qty * l.product.price,
        })),
        total: result.total!,
        createdAt: new Date().toISOString(),
        message: "¡Pedido procesado correctamente!",
      });
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-coffee/10 safe-top">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="font-display font-extrabold text-lg sm:text-xl text-coffee">Papas Doradas 🥔</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-coffee text-cream rounded-full px-3 py-1.5 text-sm font-semibold"
            >
              Carrito
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-chili text-cream text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <Link
              href="/login"
              className="text-sm font-semibold text-coffee border border-coffee/30 rounded-full px-3 py-1.5 hover:bg-coffee hover:text-cream transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero carousel */}
      {popular.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <div className={`relative rounded-3xl overflow-hidden ${flavorColorClass(popular[slide].flavor)} p-6 sm:p-8 flex items-center justify-between min-h-[200px] sm:min-h-[220px]`}>
            <div>
              <p className="text-cream/80 font-mono text-xs uppercase tracking-widest mb-2">Más pedidas</p>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-cream mb-1">
                {popular[slide].flavor}
              </h1>
              <p className="text-cream/90 mb-4 text-sm sm:text-base">{formatPresentation(popular[slide].presentation)}</p>
              <p className="font-mono font-bold text-xl sm:text-2xl text-cream">{formatMXN(popular[slide].price)}</p>
              <button
                onClick={() => addToCart(popular[slide])}
                className="mt-4 bg-cream text-coffee font-semibold px-4 py-2 rounded-full text-sm sm:text-base"
              >
                Agregar al carrito
              </button>
            </div>
            <span className="text-8xl hidden sm:block" aria-hidden>
              🥔
            </span>

            {popular.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {popular.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`w-2 h-2 rounded-full ${i === slide ? "bg-cream" : "bg-cream/40"}`}
                    aria-label={`Ir a la diapositiva ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Catalog */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-display font-bold text-xl text-coffee mb-4">Todo el catálogo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-coffee/60">Todavía no hay productos publicados.</p>
        )}
      </section>

      {/* Cart drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-coffee/50" onClick={() => setCartOpen(false)} />
        <div
          className={`absolute right-0 top-0 h-full w-full sm:w-96 bg-paper shadow-xl flex flex-col transition-transform ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-4 border-b border-coffee/10 flex items-center justify-between">
            <p className="font-display font-bold text-lg text-coffee">Tu carrito</p>
            <button onClick={() => setCartOpen(false)} className="text-coffee/60 text-xl leading-none">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 && <p className="text-coffee/50 text-sm">Todavía no agregas productos.</p>}
            {cart.map((line) => (
              <div key={line.product.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${flavorColorClass(line.product.flavor)}`}>
                  🥔
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-coffee">{line.product.flavor}</p>
                  <p className="text-xs text-coffee/50">{formatPresentation(line.product.presentation)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(line.product.id, line.qty - 1)}
                    className="w-6 h-6 rounded-full bg-cream text-coffee font-bold"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm">{line.qty}</span>
                  <button
                    onClick={() => updateQty(line.product.id, line.qty + 1)}
                    className="w-6 h-6 rounded-full bg-cream text-coffee font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="font-mono text-sm w-16 text-right">
                  {formatMXN(line.qty * line.product.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 safe-bottom border-t border-coffee/10">
            <div className="flex justify-between font-bold text-coffee mb-3">
              <span>Total</span>
              <span className="font-mono">{formatMXN(total)}</span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-chili disabled:opacity-40 hover:bg-chili-dark text-cream font-semibold py-2.5 rounded-full transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-coffee/60 flex items-center justify-center p-4">
          <div className="bg-paper rounded-2xl p-6 safe-bottom w-full max-w-sm">
            <p className="font-display font-bold text-lg text-coffee mb-1">Datos de tu pedido</p>
            <p className="text-sm text-coffee/60 mb-4">Total a pagar: {formatMXN(total)}</p>
            <form action={submitCheckout} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-coffee">Nombre</label>
                <input
                  name="name"
                  required
                  className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-coffee">Teléfono</label>
                <input
                  name="phone"
                  required
                  className="w-full mt-1 border border-coffee/20 rounded-lg px-3 py-2 text-sm"
                  placeholder="10 dígitos"
                />
              </div>
              {formError && <p className="text-chili text-sm">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="flex-1 border border-coffee/20 rounded-full py-2 text-sm font-semibold text-coffee"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-chili disabled:opacity-50 text-cream rounded-full py-2 text-sm font-semibold"
                >
                  {submitting ? "Enviando..." : "Confirmar pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ticket && <TicketReceipt ticket={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}
