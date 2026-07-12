import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry, Role } from "@/lib/types";

export const revalidate = 0;

const ACTION_LABELS: Record<string, string> = {
  pedido_cliente: "Pedido de cliente",
  venta_pos: "Venta de mostrador",
  pedido_cobrado: "Pedido marcado como cobrado",
  producto_agregado: "Producto agregado",
};

export default async function HistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const role = profile!.role as Role;

  const { data: log } = await supabase.rpc("list_audit_log");
  const entries = (log as AuditLogEntry[]) || [];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-coffee mb-1">
        {role === "propietario" ? "Historial completo" : "Historial de ventas"}
      </h1>
      <p className="text-sm text-coffee/60 mb-6">
        {role === "propietario"
          ? "Registro preciso de todas las acciones de todos los usuarios."
          : "Ventas y pedidos registrados por el equipo."}
      </p>

      <div className="bg-paper rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-cream text-coffee/70">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Acción</th>
              <th className="text-left p-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-coffee/10">
                <td className="p-3 text-coffee/60 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("es-MX")}
                </td>
                <td className="p-3">{e.actor_name}</td>
                <td className="p-3 capitalize">{e.actor_role}</td>
                <td className="p-3">{ACTION_LABELS[e.action] || e.action}</td>
                <td className="p-3 text-coffee/60 font-mono text-xs">
                  {e.details ? JSON.stringify(e.details) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="p-4 text-coffee/50 text-sm">Todavía no hay registros.</p>
        )}
      </div>
    </div>
  );
}
