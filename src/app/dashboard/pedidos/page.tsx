import { createClient } from "@/lib/supabase/server";
import PendingOrders from "@/components/PendingOrders";
import type { Order, OrderItem, Role } from "@/lib/types";

export const revalidate = 0;

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: orders } = await supabase.rpc("list_orders", { p_status: "pendiente" });
  const pendientes = (orders as Order[]) || [];

  const itemsByOrder: Record<string, OrderItem[]> = {};
  for (const order of pendientes) {
    const { data: items } = await supabase.rpc("list_order_items", { p_order_id: order.id });
    itemsByOrder[order.id] = (items as OrderItem[]) || [];
  }

  return (
    <PendingOrders
      role={profile!.role as Role}
      orders={pendientes}
      itemsByOrder={itemsByOrder}
    />
  );
}
