import { createClient } from "@/lib/supabase/server";
import { formatMXN } from "@/lib/currency";
import type { Order } from "@/lib/types";

export const revalidate = 0;

export default async function ResumenPage() {
  const supabase = createClient();

  const { data: orders } = await supabase.rpc("list_orders");
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const all = (orders as Order[]) || [];
  const today = new Date().toDateString();
  const ventasHoy = all.filter(
    (o) => o.status === "cobrado" && new Date(o.created_at).toDateString() === today
  );
  const totalHoy = ventasHoy.reduce((s, o) => s + Number(o.total), 0);
  const pendientes = all.filter((o) => o.status === "pendiente");

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-6">Resumen</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-coffee/60">Ventas de hoy</p>
          <p className="font-display font-bold text-2xl text-coffee mt-1">{formatMXN(totalHoy)}</p>
          <p className="text-xs text-coffee/50 mt-1">{ventasHoy.length} ventas cobradas</p>
        </div>
        <div className="bg-paper rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-coffee/60">Pedidos pendientes</p>
          <p className="font-display font-bold text-2xl text-chili mt-1">{pendientes.length}</p>
          <p className="text-xs text-coffee/50 mt-1">Esperando ser despachados</p>
        </div>
        <div className="bg-paper rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-coffee/60">Productos en catálogo</p>
          <p className="font-display font-bold text-2xl text-coffee mt-1">{productCount ?? 0}</p>
          <p className="text-xs text-coffee/50 mt-1">Sabores y presentaciones</p>
        </div>
      </div>
    </div>
  );
}
