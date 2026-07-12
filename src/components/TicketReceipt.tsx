"use client";

import { formatMXN, formatPresentation } from "@/lib/currency";

export interface TicketLine {
  name: string;
  flavor: string;
  presentation: "150g" | "1000g";
  qty: number;
  subtotal: number;
}

export interface TicketData {
  folio: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: TicketLine[];
  total: number;
  received?: number | null;
  change?: number | null;
  createdAt: string;
  message: string;
}

function buildWhatsAppText(t: TicketData): string {
  const lines = t.items
    .map((i) => `- ${i.name} ${i.flavor} (${formatPresentation(i.presentation)}) x${i.qty} = ${formatMXN(i.subtotal)}`)
    .join("\n");

  let text = `*Papas Doradas* 🥔\nFolio: ${t.folio}\nFecha: ${new Date(t.createdAt).toLocaleString("es-MX")}\n\n${lines}\n\nTotal: ${formatMXN(t.total)}`;

  if (t.customerName) text += `\n\nCliente: ${t.customerName}`;
  if (t.received != null && t.change != null) {
    text += `\nRecibido: ${formatMXN(t.received)}\nCambio: ${formatMXN(t.change)}`;
  }
  text += `\n\n¡Gracias por tu compra!`;
  return text;
}

export default function TicketReceipt({ ticket, onClose }: { ticket: TicketData; onClose: () => void }) {
  const waText = buildWhatsAppText(ticket);
  const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="fixed inset-0 z-50 bg-coffee/60 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="ticket-edge-top" />
        <div className="bg-paper px-6 py-5 font-mono text-sm text-coffee">
          <p className="text-center font-display font-bold text-lg mb-1">Papas Doradas</p>
          <p className="text-center text-xs text-coffee/60 mb-3">Folio {ticket.folio}</p>
          <p className="text-center text-xs text-coffee/60 mb-4">
            {new Date(ticket.createdAt).toLocaleString("es-MX")}
          </p>

          <div className="border-t border-dashed border-coffee/30 my-2" />

          <ul className="space-y-1.5">
            {ticket.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span>
                  {i.qty}x {i.flavor} ({i.presentation === "150g" ? "150g" : "1kg"})
                </span>
                <span>{formatMXN(i.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-dashed border-coffee/30 my-2" />

          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatMXN(ticket.total)}</span>
          </div>

          {ticket.received != null && ticket.change != null && (
            <>
              <div className="flex justify-between mt-1 text-coffee/70">
                <span>Recibido</span>
                <span>{formatMXN(ticket.received)}</span>
              </div>
              <div className="flex justify-between text-coffee/70">
                <span>Cambio</span>
                <span>{formatMXN(ticket.change)}</span>
              </div>
            </>
          )}

          {ticket.customerName && (
            <p className="mt-3 text-xs text-coffee/70">
              Cliente: {ticket.customerName}
              {ticket.customerPhone ? ` · ${ticket.customerPhone}` : ""}
            </p>
          )}

          <p className="text-center font-display font-semibold text-avocado mt-4">{ticket.message}</p>
        </div>
        <div className="ticket-edge" />

        <div className="flex gap-2 mt-4 safe-bottom">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center bg-avocado hover:bg-avocado-dark text-cream font-semibold py-2.5 rounded-full transition-colors"
          >
            Enviar por WhatsApp
          </a>
          <button
            onClick={onClose}
            className="px-4 bg-coffee text-cream rounded-full font-semibold hover:opacity-90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
