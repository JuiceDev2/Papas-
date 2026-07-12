"use client";

import { useState } from "react";
import type { Order, OrderItem, Role } from "@/lib/types";
import { formatMXN, formatPresentation } from "@/lib/currency";
import { markOrderCobrado } from "@/app/actions";

export default function PendingOrders({
  role,
  orders,
  itemsByOrder,
}: {
  role: Role;
  orders: Order[];
  itemsByOrder: Record<string, OrderItem[]>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const canMark = role === "propietario" || role === "colaborador";

  async function handleMark(orderId: string) {
    setBusyId(orderId);
    await markOrderCobrado(orderId);
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-6">Pedidos pendientes</h1>

      {orders.length === 0 && (
        <p className="text-coffee/60">No hay pedidos pendientes por despachar. 🎉</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-paper rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-coffee">
                  {order.folio} · {order.customer_name}
                </p>
                <p className="text-sm text-coffee/60">{order.customer_phone}</p>
                <p className="text-xs text-coffee/40">
                  {new Date(order.created_at).toLocaleString("es-MX")}
                </p>
              </div>
              <p className="font-mono font-bold text-coffee">{formatMXN(order.total)}</p>
            </div>

            <ul className="mt-3 text-sm text-coffee/80 space-y-1">
              {(itemsByOrder[order.id] || []).map((item) => (
                <li key={item.id}>
                  {item.qty}x {item.flavor} ({formatPresentation(item.presentation)})
                </li>
              ))}
            </ul>

            {canMark ? (
              <button
                onClick={() => handleMark(order.id)}
                disabled={busyId === order.id}
                className="mt-3 bg-avocado disabled:opacity-50 text-cream text-sm font-semibold px-4 py-2 rounded-full"
              >
                {busyId === order.id ? "Guardando..." : "Marcar como cobrado"}
              </button>
            ) : (
              <p className="mt-3 text-xs text-coffee/40">
                Solo el propietario o un colaborador pueden marcar este pedido como cobrado.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
